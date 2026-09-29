import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { ServiceConfig } from '../config.js'
import { ForbiddenError } from '../errors.js'

export const createCorsMiddleware = (config: ServiceConfig): RequestHandler => {
  const allowed = new Set(config.allowedOrigins)

  return (request: Request, response: Response, next: NextFunction): void => {
    response.setHeader('Vary', 'Origin')
    const origin = request.headers.origin

    if (typeof origin === 'string' && allowed.has(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin)
      response.setHeader('Access-Control-Allow-Credentials', 'true')
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Business-Id, X-Tenant-Id, X-Firebase-Id-Token, X-Id-Token, X-Request-Id')
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    }

    if (request.method === 'OPTIONS') {
      if (typeof origin === 'string' && !allowed.has(origin)) {
        response.status(403).end()
        return
      }
      response.status(204).end()
      return
    }

    next()
  }
}

export const requireAllowedOrigin = (config: ServiceConfig): RequestHandler => {
  const allowed = new Set(config.allowedOrigins)
  return (request: Request, _response: Response, next: NextFunction): void => {
    const origin = request.headers.origin
    if (typeof origin === 'string' && origin.length > 0 && !allowed.has(origin)) {
      next(new ForbiddenError('Origin no permitido'))
      return
    }
    next()
  }
}
