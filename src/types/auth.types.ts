export interface AuthPublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthUserRecord extends AuthPublicUser {
  passwordHash: string;
  passwordSalt: string;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthSuccessResponse {
  user: AuthPublicUser;
  token: string;
  expiresAt: string;
}
