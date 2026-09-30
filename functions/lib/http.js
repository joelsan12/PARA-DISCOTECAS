import { AppError, toHttpError } from "./errors.js";
import { randomId } from "./crypto.js";
import { asRecord } from "./validation.js";
import { runtimeConfig } from "./config.js";
export function getHeader(request, name) {
    const value = request.get(name);
    return typeof value === "string" ? value.trim() : undefined;
}
function parseIp(value) {
    const trimmed = value.trim().replace(/^\[|\]$/g, "");
    const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(trimmed);
    if (v4) {
        const bytes = v4.slice(1, 5).map((part) => Number(part));
        if (bytes.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255))
            return null;
        return { bytes, version: 4 };
    }
    const v6 = trimmed.split("::");
    if (v6.length > 2)
        return null;
    const expand = (segment) => {
        const bytes = [];
        for (const part of segment.split(":")) {
            if (part.length === 0)
                continue;
            if (!/^[0-9a-fA-F]{1,4}$/.test(part))
                return null;
            const value16 = Number.parseInt(part, 16);
            bytes.push((value16 >> 8) & 0xff, value16 & 0xff);
        }
        return bytes;
    };
    const head = expand(v6[0] ?? "");
    const tail = v6.length === 2 ? expand(v6[1] ?? "") : [];
    if (!head || !tail)
        return null;
    const missing = 16 - head.length - tail.length;
    if (v6.length === 1)
        return head.length === 16 ? { bytes: head, version: 6 } : null;
    if (missing < 0)
        return null;
    return { bytes: [...head, ...new Array(missing).fill(0), ...tail], version: 6 };
}
function parseRanges(csv) {
    const ranges = [];
    for (const entry of csv.split(",")) {
        const trimmed = entry.trim();
        if (!trimmed)
            continue;
        const [address, prefixText] = trimmed.split("/");
        const parsed = parseIp(address ?? "");
        if (!parsed)
            continue;
        const maxPrefix = parsed.version === 4 ? 32 : 128;
        const prefix = prefixText === undefined ? maxPrefix : Number(prefixText);
        if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix)
            continue;
        ranges.push({ bytes: parsed.bytes, prefix, version: parsed.version });
    }
    return ranges;
}
function inRanges(ip, ranges) {
    return ranges.some((range) => {
        if (range.version !== ip.version)
            return false;
        const fullBytes = Math.floor(range.prefix / 8);
        const remainingBits = range.prefix % 8;
        for (let index = 0; index < fullBytes; index += 1) {
            if (ip.bytes[index] !== range.bytes[index])
                return false;
        }
        if (remainingBits === 0)
            return true;
        const mask = (0xff << (8 - remainingBits)) & 0xff;
        return ((ip.bytes[fullBytes] ?? 0) & mask) === ((range.bytes[fullBytes] ?? 0) & mask);
    });
}
function directAddress(request) {
    try {
        if (typeof request.socket?.remoteAddress === "string" && request.socket.remoteAddress) {
            return request.socket.remoteAddress;
        }
        if (typeof request.ip === "string" && request.ip)
            return request.ip;
    }
    catch {
        return "unknown";
    }
    return "unknown";
}
/**
 * La IP del cliente solo se toma de `x-forwarded-for` cuando el par directo
 * pertenece a un proxy declarado en TRUSTED_PROXY_CIDRS. Sin esa lista el
 * encabezado es control del atacante: las cuotas de OTP y el circuit breaker
 * se indexan por IP, de modo que rotar el header las evadia por completo.
 * Con el proxy confiable se devuelve la primera direccion de la cadena que no
 * sea un proxy conocido, en lugar del valor de la izquierda.
 */
export function getClientIp(request) {
    const direct = directAddress(request);
    const directIp = parseIp(direct);
    const trusted = parseRanges(runtimeConfig.trustedProxyCidrs);
    if (!directIp || trusted.length === 0)
        return direct;
    if (!inRanges(directIp, trusted))
        return direct;
    const forwarded = getHeader(request, "x-forwarded-for");
    if (!forwarded)
        return direct;
    for (const candidate of forwarded.split(",").reverse()) {
        const parsed = parseIp(candidate);
        if (!parsed)
            continue;
        if (inRanges(parsed, trusted))
            continue;
        return candidate.trim();
    }
    return direct;
}
export function getRequestId(request) {
    return getHeader(request, "x-request-id") ?? randomId("req");
}
export function rawBody(request) {
    if (Buffer.isBuffer(request.rawBody))
        return request.rawBody;
    if (typeof request.body === "string")
        return Buffer.from(request.body, "utf8");
    if (request.body && typeof request.body === "object")
        return Buffer.from(JSON.stringify(request.body), "utf8");
    return Buffer.alloc(0);
}
export function parseJsonBody(request) {
    if (rawBody(request).length > 1_048_576)
        throw new AppError("invalid-argument", "Request body is too large", 413);
    const body = rawBody(request);
    if (body.length === 0)
        return {};
    try {
        return asRecord(JSON.parse(body.toString("utf8")), "request body");
    }
    catch {
        throw new AppError("invalid-argument", "Request body must be valid JSON");
    }
}
export function requirePost(request) {
    if (request.method !== "POST")
        throw new AppError("invalid-argument", "Only POST is supported", 405);
}
export function setCommonHeaders(response) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
}
export function sendJson(response, status, body) {
    setCommonHeaders(response);
    response.status(status).json(body);
}
export function sendHttpError(response, error) {
    const mapped = toHttpError(error);
    sendJson(response, mapped.status, mapped.body);
}
//# sourceMappingURL=http.js.map