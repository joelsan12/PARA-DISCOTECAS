import type { Request as FirebaseRequest } from "firebase-functions/v2/https";
import type { Response } from "express";
export declare function getHeader(request: FirebaseRequest, name: string): string | undefined;
/**
 * La IP del cliente solo se toma de `x-forwarded-for` cuando el par directo
 * pertenece a un proxy declarado en TRUSTED_PROXY_CIDRS. Sin esa lista el
 * encabezado es control del atacante: las cuotas de OTP y el circuit breaker
 * se indexan por IP, de modo que rotar el header las evadia por completo.
 * Con el proxy confiable se devuelve la primera direccion de la cadena que no
 * sea un proxy conocido, en lugar del valor de la izquierda.
 */
export declare function getClientIp(request: FirebaseRequest): string;
export declare function getRequestId(request: FirebaseRequest): string;
export declare function rawBody(request: FirebaseRequest): Buffer;
export declare function parseJsonBody(request: FirebaseRequest): Record<string, unknown>;
export declare function requirePost(request: FirebaseRequest): void;
export declare function setCommonHeaders(response: Response): void;
export declare function sendJson(response: Response, status: number, body: unknown): void;
export declare function sendHttpError(response: Response, error: unknown): void;
