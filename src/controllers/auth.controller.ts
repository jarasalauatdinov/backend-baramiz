import type { Request, Response } from "express";
import { loginBodySchema, registerBodySchema } from "../schemas/auth.schema";
import { authService } from "../services/auth.service";

export const register = async (request: Request, response: Response): Promise<void> => {
  const body = registerBodySchema.parse(request.body);
  const result = await authService.register(body);
  response.status(201).json(result);
};

export const login = async (request: Request, response: Response): Promise<void> => {
  const body = loginBodySchema.parse(request.body);
  const result = await authService.login(body);
  response.json(result);
};

export const me = async (request: Request, response: Response): Promise<void> => {
  const token = authService.extractBearerToken(request.header("Authorization"));
  const user = await authService.getCurrentUser(token);
  response.json({ user });
};

export const logout = async (request: Request, response: Response): Promise<void> => {
  const token = authService.extractBearerToken(request.header("Authorization"));
  await authService.logout(token);
  response.json({ message: "Logged out" });
};
