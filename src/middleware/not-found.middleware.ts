import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error";

export const notFoundMiddleware = (_request: Request, _response: Response, next: NextFunction): void => {
  next(new AppError(404, "Route not found"));
};
