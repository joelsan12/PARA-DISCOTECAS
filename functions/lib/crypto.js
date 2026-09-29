import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
export function sha256(value) {
    return createHash("sha256").update(value).digest("hex");
}
export function hmacSha256(secret, value, encoding = "hex") {
    return createHmac("sha256", secret).update(value).digest(encoding);
}
export function safeEqual(left, right) {
    const leftBuffer = Buffer.from(left, "utf8");
    const rightBuffer = Buffer.from(right, "utf8");
    if (leftBuffer.length !== rightBuffer.length)
        return false;
    return timingSafeEqual(leftBuffer, rightBuffer);
}
export function randomId(prefix) {
    return `${prefix}_${randomBytes(18).toString("base64url")}`;
}
export function randomOtpCode() {
    return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
export function hashIdentifier(secret, channel, identifier) {
    return hmacSha256(secret, `${channel}:${identifier}`);
}
export function hashOtpCode(secret, challengeId, code) {
    return hmacSha256(secret, `${challengeId}:${code}`);
}
export function hashToken(token) {
    return sha256(token);
}
export function encryptIdentifier(secret, value) {
    const key = createHash("sha256").update(secret).digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}
export function decryptIdentifier(secret, value) {
    const [ivPart, tagPart, encryptedPart] = value.split(".");
    if (!ivPart || !tagPart || !encryptedPart)
        throw new Error("Invalid encrypted identifier");
    const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final()]).toString("utf8");
}
export function stableStringify(value) {
    if (value === undefined)
        return "null";
    if (value === null || typeof value !== "object")
        return JSON.stringify(value) ?? "null";
    if (Array.isArray(value))
        return `[${value.map(stableStringify).join(",")}]`;
    const record = value;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}
//# sourceMappingURL=crypto.js.map