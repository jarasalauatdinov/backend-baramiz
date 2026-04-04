import type { Request, Response } from "express";
import { loginBodySchema, registerBodySchema } from "../schemas/auth.schema";
import {
  getAuthenticatedUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/auth.service";
import { AppError } from "../utils/app-error";

export const register = (request: Request, response: Response): void => {
  const body = registerBodySchema.parse(request.body);
  response.status(201).json({ item: registerUser(body) });
};

export const login = (request: Request, response: Response): void => {
  const body = loginBodySchema.parse(request.body);
  response.json({ item: loginUser(body) });
};

export const me = (request: Request, response: Response): void => {
  response.json({ item: { user: getAuthenticatedUser(request.header("authorization")) } });
};

export const logout = (request: Request, response: Response): void => {
  try {
    logoutUser(request.header("authorization"));
  } catch (error) {
    if (!(error instanceof AppError) || error.statusCode !== 401) {
      throw error;
    }
  }

  response.json({ message: "Logged out" });
};
