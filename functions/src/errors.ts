import { HttpsError, type FunctionsErrorCode } from "firebase-functions/v2/https";

export type AppErrorCode = Exclude<FunctionsErrorCode, "ok">;

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode, message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function toHttpsError(error: unknown): HttpsError {
  if (error instanceof HttpsError) return error;
  if (error instanceof AppError) return new HttpsError(error.code, error.message);
  if (error instanceof Error && "code" in error && error.code === "failed-precondition") {
    return new HttpsError("failed-precondition", error.message);
  }
  return new HttpsError("internal", "Internal server error");
}

export function statusForCode(code: FunctionsErrorCode): number {
  switch (code) {
    case "invalid-argument":
      return 400;
    case "unauthenticated":
      return 401;
    case "permission-denied":
      return 403;
    case "not-found":
      return 404;
    case "already-exists":
      return 409;
    case "resource-exhausted":
      return 429;
    case "failed-precondition":
      return 412;
    case "aborted":
      return 409;
    case "out-of-range":
      return 400;
    case "unimplemented":
      return 501;
    case "unavailable":
      return 503;
    case "deadline-exceeded":
      return 504;
    case "cancelled":
      return 499;
    case "data-loss":
      return 500;
    case "unknown":
    case "internal":
    case "ok":
      return 500;
  }
}

export function toHttpError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof HttpsError) {
    return {
      status: statusForCode(error.code),
      body: { error: error.code, message: error.message }
    };
  }
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: { error: error.code, message: error.message }
    };
  }
  if (error instanceof Error && "code" in error && error.code === "failed-precondition") {
    return {
      status: 503,
      body: { error: "failed-precondition", message: error.message }
    };
  }
  return {
    status: 500,
    body: { error: "internal", message: "Internal server error" }
  };
}
