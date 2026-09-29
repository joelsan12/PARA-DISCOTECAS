import { Router } from 'express'
import { getBusinessContext } from '../middleware/auth.js'
import { BadRequestError, ConflictError } from '../errors.js'
import { assertSafeId, isRecord, optionalString } from '../utils/values.js'
import type { DeviceKeyRecord, DoorRepository } from '../types.js'

const ALLOWED_KEY_TYPES = new Set(['EC', 'OKP', 'RSA'])

export const createDevicesRouter = (repository: DoorRepository): Router => {
  const router = Router()
  router.post('/v1/devices/enroll', async (request, response, next) => {
    try {
      const businessId = getBusinessContext(response)
      const body = isRecord(request.body) ? request.body : undefined
      if (!body) throw new BadRequestError('El body debe ser un objeto')
      const kid = assertSafeId(optionalString(body.kid), 'kid')
      const deviceId = assertSafeId(optionalString(body.deviceId) ?? kid, 'deviceId')
      if (!kid.startsWith('dev-')) throw new BadRequestError('kid debe identificar una terminal (dev-*)')
      const bodyBusinessId = optionalString(body.businessId)
      if (bodyBusinessId !== undefined && bodyBusinessId !== businessId) throw new BadRequestError('businessId no coincide')
      const publicKey = body.publicKey
      if (!isRecord(publicKey)) throw new BadRequestError('publicKey debe ser un JWK')
      const kty = optionalString(publicKey.kty)
      if (!kty || !ALLOWED_KEY_TYPES.has(kty)) throw new BadRequestError('publicKey.kty no es soportado')
      const existing = await repository.getDeviceKey(businessId, kid)
      if (existing && existing.active !== false && existing.deviceId !== deviceId) {
        throw new ConflictError('La llave de terminal ya está enrolada a otro dispositivo', 'DEVICE_KEY_TAKEN')
      }
      const record: DeviceKeyRecord = {
        businessId,
        kid,
        deviceId,
        publicKey,
        enrolledAt: existing?.enrolledAt ?? Date.now(),
        active: true
      }
      await repository.putDeviceKey(record)
      response.status(existing ? 200 : 201).json({
        ok: true,
        kid,
        deviceId,
        status: existing ? 'updated' : 'enrolled'
      })
    } catch (error) {
      next(error)
    }
  })
  return router
}
