import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";

const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
};

export const requireAuthToken = (request: Request, _response: Response, next: NextFunction): void => {
  const token = extractBearerToken(request.headers.authorization);

  if (!token) {
    next(new AppError(401, "Authorization token is required"));
    return;
  }

  request.headers.authorization = `Bearer ${token}`;
  next();
};

export const getAuthToken = (request: Request): string => {
  const token = extractBearerToken(request.headers.authorization);
  return token ?? "";
};
