import type { Request as FirebaseRequest } from "firebase-functions/v2/https";
import type { Response } from "express";
import { AppError, toHttpError } from "./errors.js";
import { randomId } from "./crypto.js";
import { asRecord } from "./validation.js";

export function getHeader(request: FirebaseRequest, name: string): string | undefined {
  const value = request.get(name);
  return typeof value === "string" ? value.trim() : undefined;
}

export function getClientIp(request: FirebaseRequest): string {
  try {
    const forwarded = getHeader(request, "x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
    if (typeof request.ip === "string" && request.ip) return request.ip;
    const socketAddress = request.socket?.remoteAddress;
    if (typeof socketAddress === "string" && socketAddress) return socketAddress;
  } catch {
    return "unknown";
  }
  return "unknown";
}

export function getRequestId(request: FirebaseRequest): string {
  return getHeader(request, "x-request-id") ?? randomId("req");
}

export function rawBody(request: FirebaseRequest): Buffer {
  if (Buffer.isBuffer(request.rawBody)) return request.rawBody;
  if (typeof request.body === "string") return Buffer.from(request.body, "utf8");
  if (request.body && typeof request.body === "object") return Buffer.from(JSON.stringify(request.body), "utf8");
  return Buffer.alloc(0);
}

export function parseJsonBody(request: FirebaseRequest): Record<string, unknown> {
  if (rawBody(request).length > 1_048_576) throw new AppError("invalid-argument", "Request body is too large", 413);
  const body = rawBody(request);
  if (body.length === 0) return {};
  try {
    return asRecord(JSON.parse(body.toString("utf8")), "request body");
  } catch {
    throw new AppError("invalid-argument", "Request body must be valid JSON");
  }
}

export function requirePost(request: FirebaseRequest): void {
  if (request.method !== "POST") throw new AppError("invalid-argument", "Only POST is supported", 405);
}

export function setCommonHeaders(response: Response): void {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
}

export function sendJson(response: Response, status: number, body: unknown): void {
  setCommonHeaders(response);
  response.status(status).json(body);
}

export function sendHttpError(response: Response, error: unknown): void {
  const mapped = toHttpError(error);
  sendJson(response, mapped.status, mapped.body);
}
