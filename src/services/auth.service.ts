import crypto from "node:crypto";
import path from "node:path";
import { env } from "../config/env";
import { authSessionsDataSchema, authUsersDataSchema } from "../schemas/tourism-data.schema";
import type { AuthPayload, AuthSession, AuthUser, StoredAuthUser } from "../types/tourism.types";
import { AppError } from "../utils/app-error";
import { readJsonFile, writeJsonFile } from "../utils/json-storage";

const usersFilePath = path.join(process.cwd(), "src", "data", "auth-users.json");
const sessionsFilePath = path.join(process.cwd(), "src", "data", "auth-sessions.json");

let usersCache: StoredAuthUser[] | null = null;
let sessionsCache: AuthSession[] | null = null;

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const now = (): Date => new Date();

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
};

const verifyPassword = (password: string, passwordHash: string): boolean => {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64);
  const storedKey = Buffer.from(storedHash, "hex");

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, storedKey);
};

const loadUsers = (): StoredAuthUser[] => {
  if (usersCache) {
    return usersCache;
  }

  usersCache = readJsonFile(usersFilePath, authUsersDataSchema, []);
  return usersCache;
};

const saveUsers = (users: StoredAuthUser[]): StoredAuthUser[] => {
  usersCache = writeJsonFile(usersFilePath, authUsersDataSchema, users);
  return usersCache;
};

const loadSessions = (): AuthSession[] => {
  if (sessionsCache) {
    return sessionsCache;
  }

  sessionsCache = readJsonFile(sessionsFilePath, authSessionsDataSchema, []);
  return sessionsCache;
};

const saveSessions = (sessions: AuthSession[]): AuthSession[] => {
  sessionsCache = writeJsonFile(sessionsFilePath, authSessionsDataSchema, sessions);
  return sessionsCache;
};

const stripPasswordHash = (user: StoredAuthUser): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const removeExpiredSessions = (): AuthSession[] => {
  const currentTime = now().getTime();
  const activeSessions = loadSessions().filter((session) => {
    return new Date(session.expiresAt).getTime() > currentTime;
  });

  if (activeSessions.length !== loadSessions().length) {
    saveSessions(activeSessions);
  }

  return activeSessions;
};

const createSessionForUser = (userId: string): AuthSession => {
  const createdAt = now();
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + env.AUTH_TOKEN_TTL_DAYS);

  const nextSession: AuthSession = {
    id: crypto.randomUUID(),
    userId,
    token: crypto.randomBytes(32).toString("hex"),
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  saveSessions([...removeExpiredSessions(), nextSession]);
  return nextSession;
};

const buildAuthPayload = (user: StoredAuthUser): AuthPayload => {
  const session = createSessionForUser(user.id);

  return {
    user: stripPasswordHash(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
};

const findUserByEmail = (email: string): StoredAuthUser | undefined => {
  const normalizedEmail = normalizeEmail(email);
  return loadUsers().find((user) => user.email === normalizedEmail);
};

const parseBearerToken = (authorizationHeader?: string): string => {
  if (!authorizationHeader) {
    throw new AppError(401, "Authentication required");
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token?.trim()) {
    throw new AppError(401, "Use a Bearer token in the Authorization header");
  }

  return token.trim();
};

export const registerUser = (input: {
  name: string;
  email: string;
  password: string;
}): AuthPayload => {
  if (findUserByEmail(input.email)) {
    throw new AppError(409, "An account with this email already exists");
  }

  const nextUser: StoredAuthUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    passwordHash: hashPassword(input.password),
    createdAt: now().toISOString(),
  };

  saveUsers([...loadUsers(), nextUser]);
  return buildAuthPayload(nextUser);
};

export const loginUser = (input: { email: string; password: string }): AuthPayload => {
  const user = findUserByEmail(input.email);

  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    throw new AppError(401, "Invalid email or password");
  }

  return buildAuthPayload(user);
};

export const getAuthenticatedUser = (authorizationHeader?: string): AuthUser => {
  const token = parseBearerToken(authorizationHeader);
  const activeSessions = removeExpiredSessions();
  const session = activeSessions.find((currentSession) => currentSession.token === token);

  if (!session) {
    throw new AppError(401, "Session expired or invalid");
  }

  const user = loadUsers().find((currentUser) => currentUser.id === session.userId);

  if (!user) {
    throw new AppError(401, "Session expired or invalid");
  }

  return stripPasswordHash(user);
};

export const logoutUser = (authorizationHeader?: string): void => {
  const token = parseBearerToken(authorizationHeader);
  const sessions = removeExpiredSessions();
  const nextSessions = sessions.filter((session) => session.token !== token);

  if (nextSessions.length === sessions.length) {
    throw new AppError(401, "Session expired or invalid");
  }

  saveSessions(nextSessions);
};
