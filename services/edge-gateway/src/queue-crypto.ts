import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { isRecord } from "./crypto.js";

/**
 * Cifrado de la cola offline persistida del gateway (AGENTS §6.3).
 *
 * Cada línea del JSONL se sella con AES-256-GCM usando un IV aleatorio de
 * 12 bytes por registro, de modo que dos eventos idénticos nunca producen la
 * misma línea. La clave se deriva una sola vez en `loadConfig`:
 *
 *  - `EDGE_QUEUE_KEY` (base64 de 32 bytes) si el operador la define, o
 *  - HKDF-SHA256 sobre `EDGE_HMAC_SECRET` con `info = gatewayId`, que aporta
 *    aislamiento por instancia sin ninguna variable nueva obligatoria.
 *
 * La autenticación GCM hace que una línea alterada o sellada con otra clave
 * falle en lugar de devolver datos corruptos: el registro se descarta y se
 * contabiliza como `unreadable`.
 */

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const LINE_VERSION = 1;

export interface SealedLine {
  v: number;
  iv: string;
  ct: string;
}

export function isSealedRecord(value: Record<string, unknown>): value is Record<string, unknown> & SealedLine {
  return (
    value.v === LINE_VERSION &&
    typeof value.iv === "string" &&
    typeof value.ct === "string" &&
    value.kind === undefined
  );
}

export function deriveQueueKey(options: { queueKeyBase64?: string; hmacSecret: string; gatewayId: string }): Buffer {
  const explicit = options.queueKeyBase64?.trim() ?? "";
  if (explicit.length > 0) {
    const key = Buffer.from(explicit, "base64");
    if (key.length !== KEY_BYTES) {
      throw new Error("EDGE_QUEUE_KEY must decode to exactly 32 bytes of base64");
    }
    return key;
  }
  const material = options.hmacSecret.length > 0 ? options.hmacSecret : "edge-gateway-development-queue-key";
  return Buffer.from(
    hkdfSync("sha256", material, "nightflow-edge-queue-v1", `nightflow-edge-queue:${options.gatewayId}`, KEY_BYTES)
  );
}

export class QueueCrypto {
  private readonly key: Buffer;

  public constructor(key: Buffer) {
    if (!Buffer.isBuffer(key) || key.length !== KEY_BYTES) {
      throw new Error("queue key must be a 32 byte Buffer");
    }
    this.key = key;
  }

  public seal(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const payload = Buffer.concat([ciphertext, cipher.getAuthTag()]);
    return JSON.stringify({ v: LINE_VERSION, iv: iv.toString("base64"), ct: payload.toString("base64") });
  }

  public open(line: string): string | null {
    let record: unknown;
    try {
      record = JSON.parse(line);
    } catch {
      return null;
    }
    if (!isRecord(record) || !isSealedRecord(record)) {
      return null;
    }
    try {
      const iv = Buffer.from(record.iv, "base64");
      const payload = Buffer.from(record.ct, "base64");
      if (iv.length !== IV_BYTES || payload.length <= TAG_BYTES) {
        return null;
      }
      const decipher = createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(payload.subarray(payload.length - TAG_BYTES));
      const plaintext = Buffer.concat([
        decipher.update(payload.subarray(0, payload.length - TAG_BYTES)),
        decipher.final()
      ]);
      return plaintext.toString("utf8");
    } catch {
      return null;
    }
  }
}
