import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { BadRequestError, ForbiddenError } from '../errors.js'
import type { AuthenticatedUser, CustomerRecord, DoorRepository } from '../types.js'
import { assertSafeId, getHeaderValue, optionalString } from '../utils/values.js'
import { StaffAuthorizer } from '../services/staff-authorizer.js'
import type { IdTokenVerifier } from '../services/auth-service.js'

export interface AuthenticatedLocals {
  authUser?: AuthenticatedUser
  businessId?: string
  staff?: Awaited<ReturnType<StaffAuthorizer['authorize']>>
  customer?: CustomerRecord
  callerRole?: 'staff' | 'customer'
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
      response.locals.callerRole = 'staff'
      next()
    } catch (error) {
      next(error)
    }
  }
}

export interface CallerContext {
  uid: string
  role: 'staff' | 'customer'
}

export const getCallerContext = (response: Response): CallerContext => {
  const user = getAuthenticatedUser(response)
  const role = (response.locals.callerRole as 'staff' | 'customer' | undefined) ?? 'staff'
  return { uid: user.uid, role }
}

export type StaffRole = 'owner' | 'manager' | 'door' | 'finance'

const roleRank: Record<StaffRole, number> = { owner: 4, manager: 3, door: 2, finance: 1 }

export const isStaffRole = (value: string): value is StaffRole => value in roleRank

/**
 * El middleware de autorizacion solo exigia "cualquier staff activo", de modo
 * que una cuenta de `finance` podia enrolar su propia llave de terminal
 * (`/v1/devices/enroll`) y luego firmar eventos de puerta con ella: la
 * escalacion de privilegios mas directa del servicio. Cada grupo de rutas
 * declara el rol minimo que AGENTS 8 exige para esa operacion.
 */
export const requireStaffRole = (minimum: StaffRole): RequestHandler => {
  return (_request: Request, response: Response, next: NextFunction): void => {
    const staff = response.locals.staff as { role?: string } | undefined
    if (!staff || !isStaffRole(staff.role ?? '')) {
      next(new ForbiddenError('El rol del staff no es valido'))
      return
    }
    if (roleRank[staff.role as StaffRole] < roleRank[minimum]) {
      next(new ForbiddenError(`Se requiere rol ${minimum} para esta operacion`))
      return
    }
    next()
  }
}

export const createTicketAuthorizationMiddleware = (
  authorizer: StaffAuthorizer,
  repository: DoorRepository
): RequestHandler => {
  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getAuthenticatedUser(response)
      const businessId = getRequestBusinessId(request, user)
      response.locals.businessId = businessId

      // 1. Intentar autorización como staff
      try {
        const staff = await authorizer.authorize(businessId, user)
        response.locals.staff = staff
        response.locals.callerRole = 'staff'
        next()
        return
      } catch {
        // No es staff activo, intentar como cliente activo
      }

      // 2. Intentar autorización como cliente activo
      const customer = await repository.getCustomer(businessId, user.uid)
      if (customer && customer.active) {
        response.locals.customer = customer
        response.locals.callerRole = 'customer'
        next()
        return
      }

      throw new ForbiddenError('El usuario no tiene acceso de staff ni de cliente activo en este business')
    } catch (error) {
      next(error)
    }
  }
}

export const getStaffRepository = (repository: DoorRepository): DoorRepository => repository
