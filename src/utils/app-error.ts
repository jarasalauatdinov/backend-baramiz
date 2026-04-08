import type { ErrorDetail } from "../types/tourism.types";

export class AppError extends Error {
  public readonly code?: string;
  public readonly statusCode: number;
  public readonly errors?: ErrorDetail[];
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    codeOrErrors?: string | ErrorDetail[],
    errors?: ErrorDetail[],
    details?: unknown,
  ) {
    super(message);
    this.code = typeof codeOrErrors === "string" ? codeOrErrors : undefined;
    this.statusCode = statusCode;
    this.errors = Array.isArray(codeOrErrors) ? codeOrErrors : errors;
    this.details = details;
  }
}
