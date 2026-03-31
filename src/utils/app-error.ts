import type { ErrorDetail } from "../types/tourism.types";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: ErrorDetail[];

  constructor(statusCode: number, message: string, errors?: ErrorDetail[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}
