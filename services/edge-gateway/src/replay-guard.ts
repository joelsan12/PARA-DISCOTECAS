import type { GatewayConfig } from "./types.js";

/**
 * Guarda anti-replay de nonces de autenticación (AGENTS §6.3).
 *
 * La ventana de retención es `authWindowMs`: un nonce más antiguo que eso ya
 * no puede corresponded a un timestamp dentro de la ventana válida, así que
 * puede descartarse sin perder protección.
 *
 * El estado vive en memoria. El gateway es un proceso único por local del
 * club, y la consecuencia de un reinicio es que la ventana anti-replay empieza
 * de cero — acotada por `authWindowMs` (5 min por defecto), nunca por toda la
 * vida del proceso.
 */
export class ReplayGuard {
  private readonly seen = new Map<string, number>();
  private lastSweep = 0;

  public constructor(private readonly config: GatewayConfig) {}

  /**
   * Registra un nonce. Devuelve `false` si ya fue usado (replay) o si el
   * nonce está vacío o es demasiado largo.
   */
  public claim(nonce: string, scope: string): boolean {
    const normalized = nonce.trim();
    if (normalized.length < 8 || normalized.length > 128) {
      return false;
    }
    const now = Date.now();
    this.sweep(now);
    const key = `${scope}:${normalized}`;
    if (this.seen.has(key)) {
      return false;
    }
    if (this.seen.size >= this.config.maxTrackedNonces) {
      const oldest = this.seen.keys().next();
      if (!oldest.done) {
        this.seen.delete(oldest.value);
      }
    }
    this.seen.set(key, now + this.config.authWindowMs);
    return true;
  }

  public get size(): number {
    return this.seen.size;
  }

  private sweep(now: number): void {
    if (now - this.lastSweep < 1_000) {
      return;
    }
    this.lastSweep = now;
    for (const [key, expiresAt] of this.seen) {
      if (expiresAt <= now) {
        this.seen.delete(key);
      }
    }
  }
}