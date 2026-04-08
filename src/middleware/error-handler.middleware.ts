import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";

export const errorHandlerMiddleware: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      code: error.code ?? "APP_ERROR",
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
      ...(error.details !== undefined ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({
      code: "INVALID_JSON",
      message: "Invalid JSON payload",
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
};
