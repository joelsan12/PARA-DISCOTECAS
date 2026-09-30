export class HttpError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: Record<string, unknown>

  constructor(statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'BAD_REQUEST', message, details)
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Firebase ID token inválido o ausente') {
    super(401, 'UNAUTHORIZED', message)
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'El usuario no está autorizado para este business', code = 'FORBIDDEN', details?: Record<string, unknown>) {
    super(403, code, message, details)
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message)
  }
}

export class ConflictError extends HttpError {
  constructor(message: string, code = 'CONFLICT', details?: Record<string, unknown>) {
    super(409, code, message, details)
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string, code = 'SERVICE_UNAVAILABLE', details?: Record<string, unknown>) {
    super(503, code, message, details)
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message = 'Demasiadas solicitudes', details?: Record<string, unknown>) {
    super(429, 'RATE_LIMITED', message, details)
  }
}
