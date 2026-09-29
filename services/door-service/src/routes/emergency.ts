import { Router, type NextFunction, type Request, type Response } from 'express'
import { getBusinessContext } from '../middleware/auth.js'
import type { EmergencyService } from '../services/emergency-service.js'
import { isRecord, optionalString, assertSafeId } from '../utils/values.js'
import type { EmergencyStatus } from '../types.js'

const publicStatus = (status: EmergencyStatus): Record<string, unknown> => ({
  businessId: status.businessId,
  eventId: status.eventId,
  deviceId: status.deviceId,
  active: status.active,
  blocked: status.eventCanceled || status.revocationVersion > 0 || status.revokedBefore !== undefined,
  state: status.eventCanceled ? 'CANCELED' : status.revocationVersion > 0 || status.revokedBefore !== undefined ? 'REVOKED' : 'CLEAR',
  eventCanceled: status.eventCanceled,
  revocationVersion: status.revocationVersion,
  version: status.revocationVersion,
  revokedBefore: status.revokedBefore === undefined ? undefined : new Date(status.revokedBefore).toISOString(),
  reason: status.reason,
  actorUid: status.actorUid,
  createdAt: status.createdAt
})

const readParameters = (body: unknown, query: Record<string, unknown>): { eventId?: string; deviceId?: string } => {
  const source = isRecord(body) ? body : {}
  const eventValue = source.eventId ?? source.event_id ?? query.eventId ?? query.event_id
  const deviceValue = source.deviceId ?? source.device_id ?? query.deviceId ?? query.device_id
  const eventId = optionalString(eventValue)
  const deviceId = optionalString(deviceValue)
  if (eventId !== undefined) assertSafeId(eventId, 'eventId')
  if (deviceId !== undefined) assertSafeId(deviceId, 'deviceId')
  return { eventId, deviceId }
}

export const createEmergencyRouter = (emergency: EmergencyService): Router => {
  const router = Router()
  const handler = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const query = request.query as Record<string, unknown>
      const parameters = readParameters(request.method === 'GET' ? undefined : request.body, query)
      const status = await emergency.getStatus(getBusinessContext(response), parameters.eventId, parameters.deviceId)
      response.status(200).json(publicStatus(status))
    } catch (error) {
      next(error)
    }
  }
  router.get('/v1/emergency/status', (request, response, next) => { void handler(request, response, next) })
  router.post('/v1/emergency/status', (request, response, next) => { void handler(request, response, next) })
  return router
}
