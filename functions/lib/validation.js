import { AppError } from "./errors.js";
export function asRecord(value, name = "request") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new AppError("invalid-argument", `${name} must be an object`);
    }
    return value;
}
export function assertAllowedKeys(record, allowed) {
    const allowedSet = new Set(allowed);
    if (Object.keys(record).some((key) => !allowedSet.has(key))) {
        throw new AppError("invalid-argument", "Request contains unsupported fields");
    }
}
export function requiredString(record, key, minimum = 1, maximum = 256) {
    const value = record[key];
    if (typeof value !== "string")
        throw new AppError("invalid-argument", `${key} is required`);
    const normalized = value.trim();
    if (normalized.length < minimum || normalized.length > maximum) {
        throw new AppError("invalid-argument", `${key} has an invalid length`);
    }
    return normalized;
}
export function optionalString(record, key, minimum = 1, maximum = 256) {
    const value = record[key];
    if (value === undefined || value === null || value === "")
        return undefined;
    if (typeof value !== "string")
        throw new AppError("invalid-argument", `${key} must be a string`);
    const normalized = value.trim();
    if (normalized.length < minimum || normalized.length > maximum) {
        throw new AppError("invalid-argument", `${key} has an invalid length`);
    }
    return normalized;
}
export function requiredId(record, key) {
    const value = requiredString(record, key, 1, 128);
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value)) {
        throw new AppError("invalid-argument", `${key} has an invalid format`);
    }
    return value;
}
export function optionalId(record, key) {
    const value = optionalString(record, key, 1, 128);
    if (value === undefined)
        return undefined;
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value)) {
        throw new AppError("invalid-argument", `${key} has an invalid format`);
    }
    return value;
}
export function requiredEmail(record, key) {
    const value = requiredString(record, key, 3, 320).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw new AppError("invalid-argument", `${key} is invalid`);
    }
    return value;
}
export function optionalEmail(record, key) {
    const value = optionalString(record, key, 3, 320);
    if (value === undefined)
        return undefined;
    const normalized = value.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        throw new AppError("invalid-argument", `${key} is invalid`);
    }
    return normalized;
}
export function requiredPhone(record, key) {
    const value = requiredString(record, key, 8, 32);
    const normalized = normalizePhone(value);
    if (normalized === undefined)
        throw new AppError("invalid-argument", `${key} is invalid`);
    return normalized;
}
export function optionalPhone(record, key) {
    const value = optionalString(record, key, 8, 32);
    if (value === undefined)
        return undefined;
    const normalized = normalizePhone(value);
    if (normalized === undefined)
        throw new AppError("invalid-argument", `${key} is invalid`);
    return normalized;
}
export function normalizePhone(value) {
    const trimmed = value.trim().replace(/^whatsapp:/i, "");
    const hasPlus = trimmed.startsWith("+");
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15)
        return undefined;
    return `${hasPlus ? "+" : ""}${digits}`;
}
export function requiredNumber(record, key, minimum, maximum) {
    const value = record[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
        throw new AppError("invalid-argument", `${key} is invalid`);
    }
    return value;
}
export function optionalNumber(record, key, minimum, maximum) {
    const value = record[key];
    if (value === undefined || value === null)
        return undefined;
    if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
        throw new AppError("invalid-argument", `${key} is invalid`);
    }
    return value;
}
export function requiredBoolean(record, key, fallback) {
    const value = record[key];
    if (value === undefined && fallback !== undefined)
        return fallback;
    if (typeof value !== "boolean")
        throw new AppError("invalid-argument", `${key} must be boolean`);
    return value;
}
export function requiredEnum(record, key, values) {
    const value = record[key];
    if (typeof value !== "string" || !values.includes(value)) {
        throw new AppError("invalid-argument", `${key} is invalid`);
    }
    return value;
}
export function safeReturnPath(record, key) {
    const value = optionalString(record, key, 1, 512);
    if (value === undefined)
        return undefined;
    if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
        throw new AppError("invalid-argument", `${key} is invalid`);
    }
    return value;
}
export function stringValue(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
}
export function numberValue(value) {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
//# sourceMappingURL=validation.js.map