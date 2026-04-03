import type { Request, Response } from "express";
import { loginBodySchema, registerBodySchema } from "../schemas/auth.schema";
import {
  getAuthenticatedUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../services/auth.service";

export const register = (request: Request, response: Response): void => {
  const body = registerBodySchema.parse(request.body);
  response.status(201).json({ item: registerUser(body) });
};

export const login = (request: Request, response: Response): void => {
  const body = loginBodySchema.parse(request.body);
  response.json({ item: loginUser(body) });
};

export const me = (request: Request, response: Response): void => {
  response.json({ item: getAuthenticatedUser(request.header("authorization")) });
};

export const logout = (request: Request, response: Response): void => {
  logoutUser(request.header("authorization"));
  response.json({ message: "Logged out successfully" });
};
