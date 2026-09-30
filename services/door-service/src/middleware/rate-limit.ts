import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { TooManyRequestsError } from '../errors.js'
import { getAuthenticatedUser } from './auth.js'

export interface RateLimitOptions {
  windowSeconds: number
  max: number
  keyPrefix: string
}

interface Bucket {
  count: number
  resetAt: number
}

/**
 * Limitador en memoria por uid autenticado. El servicio de puerta corre como
 * una unica instancia en Render (AGENTS 14.1), asi que el estado por proceso
 * es suficiente y evita una lectura de Firestore por request en la ruta mas
 * caliente. El objetivo es contener el abuso y el desperdicio de cuota de
 * Firestore, no la tolerancia a DDoS distribuido.
 */
export const createRateLimitMiddleware = (options: RateLimitOptions): RequestHandler => {
  const buckets = new Map<string, Bucket>()
  const windowMs = options.windowSeconds * 1000
  const sweep = (now: number): void => {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }

  return (_request: Request, response: Response, next: NextFunction): void => {
    let user: { uid: string }
    try {
      user = getAuthenticatedUser(response)
    } catch (error) {
      next(error)
      return
    }
    const now = Date.now()
    if (buckets.size > 5_000) sweep(now)
    const key = `${options.keyPrefix}:${user.uid}`
    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      response.setHeader('X-RateLimit-Remaining', String(options.max - 1))
      next()
      return
    }
    bucket.count += 1
    if (bucket.count > options.max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))
      response.setHeader('Retry-After', String(retryAfter))
      next(new TooManyRequestsError('Demasiadas solicitudes; reintente mas tarde', { retryAfterSeconds: retryAfter }))
      return
    }
    response.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.max - bucket.count)))
    next()
  }
}