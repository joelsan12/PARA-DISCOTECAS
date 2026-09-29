import type { ErrorRequestHandler, RequestHandler } from 'express'
import { HttpError } from '../errors.js'

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } })
}

const isDependencyError = (error: unknown): boolean => {
  if (error instanceof HttpError) return error.statusCode === 503
  if (!(error instanceof Error)) return false
  const code = 'code' in error && (typeof error.code === 'string' || typeof error.code === 'number') ? String(error.code) : ''
  return ['7', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'PERMISSION_DENIED', 'permission-denied', 'unavailable', 'deadline-exceeded', 'internal'].includes(code)
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (isDependencyError(error)) {
    response.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Dependencia no disponible' } })
    return
  }
  if (error instanceof SyntaxError && 'status' in error && error.status === 400) {
    response.status(400).json({ error: { code: 'BAD_REQUEST', message: 'JSON inválido' } })
    return
  }
  if (error instanceof HttpError) {
    const body: { error: { code: string; message: string; details?: Record<string, unknown> } } = {
      error: {
        code: error.code,
        message: error.message
      }
    }
    if (error.details) body.error.details = error.details
    response.status(error.statusCode).json(body)
    return
  }

  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Error interno' } })
}
