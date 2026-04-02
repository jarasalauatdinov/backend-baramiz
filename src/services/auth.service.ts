import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { env } from "../config/env";
import type { AuthPublicUser, AuthSessionRecord, AuthSuccessResponse, AuthUserRecord } from "../types/auth.types";
import { AppError } from "../utils/app-error";

const scryptAsync = promisify(scrypt);
const usersFilePath = path.join(process.cwd(), "src", "data", "auth-users.json");
const sessionsFilePath = path.join(process.cwd(), "src", "data", "sessions.json");
const sessionTtlMs = env.AUTH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

const ensureJsonFile = async <T>(filePath: string, fallbackValue: T): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallbackValue, null, 2));
  }
};

const readJsonFile = async <T>(filePath: string, fallbackValue: T): Promise<T> => {
  await ensureJsonFile(filePath, fallbackValue);
  const raw = await fs.readFile(filePath, "utf-8");

  try {
    return JSON.parse(raw) as T;
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallbackValue, null, 2));
    return fallbackValue;
  }
};

const writeJsonFile = async <T>(filePath: string, value: T): Promise<void> => {
  await ensureJsonFile(filePath, value);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2));
};

const hashPassword = async (password: string, salt: string): Promise<string> => {
  const derivedKey = await scryptAsync(password, salt, 64);
  return (derivedKey as Buffer).toString("hex");
};

const verifyPassword = async (password: string, user: AuthUserRecord): Promise<boolean> => {
  const derivedHash = await hashPassword(password, user.passwordSalt);

  return timingSafeEqual(
    Buffer.from(user.passwordHash, "hex"),
    Buffer.from(derivedHash, "hex"),
  );
};

const toPublicUser = (user: AuthUserRecord): AuthPublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

class AuthService {
  private async getUsers(): Promise<AuthUserRecord[]> {
    return readJsonFile<AuthUserRecord[]>(usersFilePath, []);
  }

  private async saveUsers(users: AuthUserRecord[]): Promise<void> {
    await writeJsonFile(usersFilePath, users);
  }

  private async getSessions(): Promise<AuthSessionRecord[]> {
    const sessions = await readJsonFile<AuthSessionRecord[]>(sessionsFilePath, []);
    const activeSessions = sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());

    if (activeSessions.length !== sessions.length) {
      await this.saveSessions(activeSessions);
    }

    return activeSessions;
  }

  private async saveSessions(sessions: AuthSessionRecord[]): Promise<void> {
    await writeJsonFile(sessionsFilePath, sessions);
  }

  private async createSessionResponse(user: AuthUserRecord): Promise<AuthSuccessResponse> {
    const rawToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + sessionTtlMs).toISOString();
    const nextSession: AuthSessionRecord = {
      id: randomUUID(),
      userId: user.id,
      tokenHash: sha256(rawToken),
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    const sessions = await this.getSessions();
    await this.saveSessions([...sessions, nextSession]);

    return {
      user: toPublicUser(user),
      token: rawToken,
      expiresAt,
    };
  }

  async register(input: { name: string; email: string; password: string }): Promise<AuthSuccessResponse> {
    const users = await this.getUsers();
    const normalizedEmail = input.email.trim().toLowerCase();

    if (users.some((user) => user.email === normalizedEmail)) {
      throw new AppError(409, "An account with this email already exists");
    }

    const passwordSalt = randomBytes(16).toString("hex");
    const nextUser: AuthUserRecord = {
      id: randomUUID(),
      name: input.name.trim(),
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      passwordSalt,
      passwordHash: await hashPassword(input.password, passwordSalt),
    };

    await this.saveUsers([...users, nextUser]);
    return this.createSessionResponse(nextUser);
  }

  async login(input: { email: string; password: string }): Promise<AuthSuccessResponse> {
    const users = await this.getUsers();
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = users.find((candidate) => candidate.email === normalizedEmail);

    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const isPasswordValid = await verifyPassword(input.password, user);
    if (!isPasswordValid) {
      throw new AppError(401, "Invalid email or password");
    }

    return this.createSessionResponse(user);
  }

  async getCurrentUser(token: string): Promise<AuthPublicUser> {
    const sessions = await this.getSessions();
    const currentSession = sessions.find((session) => session.tokenHash === sha256(token));

    if (!currentSession) {
      throw new AppError(401, "Authentication required");
    }

    const users = await this.getUsers();
    const user = users.find((candidate) => candidate.id === currentSession.userId);

    if (!user) {
      throw new AppError(401, "Authentication required");
    }

    return toPublicUser(user);
  }

  async logout(token: string): Promise<void> {
    const sessions = await this.getSessions();
    const nextSessions = sessions.filter((session) => session.tokenHash !== sha256(token));

    if (nextSessions.length === sessions.length) {
      throw new AppError(401, "Authentication required");
    }

    await this.saveSessions(nextSessions);
  }

  extractBearerToken(authorizationHeader: string | undefined): string {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Authentication required");
    }

    const token = authorizationHeader.slice("Bearer ".length).trim();
    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    return token;
  }
}

export const authService = new AuthService();
