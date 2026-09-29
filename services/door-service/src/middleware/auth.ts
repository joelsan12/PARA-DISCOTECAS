import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { BadRequestError, ForbiddenError } from '../errors.js'
import type { AuthenticatedUser, DoorRepository } from '../types.js'
import { assertSafeId, getHeaderValue, optionalString } from '../utils/values.js'
import { StaffAuthorizer } from '../services/staff-authorizer.js'
import type { IdTokenVerifier } from '../services/auth-service.js'

export interface AuthenticatedLocals {
  authUser?: AuthenticatedUser
  businessId?: string
  staff?: Awaited<ReturnType<StaffAuthorizer['authorize']>>
}

export const getAuthenticatedUser = (response: Response): AuthenticatedUser => {
  const user = response.locals.authUser as AuthenticatedUser | undefined
  if (!user) throw new ForbiddenError('No hay un usuario autenticado')
  return user
}

export const getBusinessContext = (response: Response): string => {
  const businessId = response.locals.businessId as string | undefined
  if (!businessId) throw new ForbiddenError('No hay un business autorizado')
  return businessId
}

export const getRequestBusinessId = (request: Request, user?: AuthenticatedUser): string => {
  const body = request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
  const header = getHeaderValue(request, 'x-business-id') ?? getHeaderValue(request, 'x-tenant-id')
  const query = typeof request.query.businessId === 'string' ? request.query.businessId : typeof request.query.business_id === 'string' ? request.query.business_id : undefined
  const claim = user?.claims.businessId ?? user?.claims.business_id
  const values = [optionalString(header), optionalString(body.businessId), optionalString(body.business_id), optionalString(query), optionalString(claim)].filter((value): value is string => value !== undefined)
  if (values.length === 0) throw new BadRequestError('businessId es obligatorio')
  if (new Set(values).size > 1) throw new BadRequestError('businessId no coincide entre header, query y body')
  return assertSafeId(values[0], 'businessId')
}

export const createAuthenticationMiddleware = (authService: IdTokenVerifier): RequestHandler => {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const authorization = getHeaderValue(request, 'authorization') ?? getHeaderValue(request, 'x-firebase-id-token') ?? getHeaderValue(request, 'x-id-token')
      const match = typeof authorization === 'string' ? /^(?:Bearer\s+)?([^\s]+)$/iu.exec(authorization) : null
      if (!match?.[1]) {
        response.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Firebase ID token es obligatorio' } })
        return
      }
      const user = await authService.verifyIdToken(match[1])
      response.locals.authUser = user
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const createBusinessAuthorizationMiddleware = (authorizer: StaffAuthorizer): RequestHandler => {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getAuthenticatedUser(response)
      const businessId = getRequestBusinessId(request, user)
      const staff = await authorizer.authorize(businessId, user)
      response.locals.businessId = businessId
      response.locals.staff = staff
      next()
    } catch (error) {
      next(error)
    }
  }
}

export const getStaffRepository = (repository: DoorRepository): DoorRepository => repository
