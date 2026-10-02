import { ERROR_CODES, type ErrorCode } from "./codes";

/** Discriminated result type used across services and API handlers. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: AppError };

export class AppError extends Error {
  code: ErrorCode;
  userMessage: string;
  httpStatus: number;
  technical?: string;

  constructor(code: ErrorCode, technical?: string) {
    const def = ERROR_CODES[code];
    super(def.user);
    this.name = "AppError";
    this.code = code;
    this.userMessage = def.user;
    this.httpStatus = def.http;
    this.technical = technical;
  }

  toJSON() {
    return { code: this.code, message: this.userMessage };
  }
}

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(code: ErrorCode, technical?: string): Result<never> {
  return { ok: false, error: new AppError(code, technical) };
}

/** Normalize any thrown value into an AppError. */
export function toAppError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  const msg = e instanceof Error ? e.message : String(e);
  return new AppError("UNKNOWN", msg);
}
