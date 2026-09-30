import { createHmac, timingSafeEqual } from 'node:crypto'
import { compactVerify, decodeProtectedHeader, importJWK, type JWK } from 'jose'
import type { ServiceConfig } from '../config.js'
import { ServiceUnavailableError, UnauthorizedError, BadRequestError } from '../errors.js'
import { isRecord, optionalString } from '../utils/values.js'
import type { DoorRepository } from '../types.js'
import type { KeyService } from './key-service.js'

export interface VerifiedAttendanceSignature {
  payload: Record<string, unknown>
  header?: Record<string, unknown>
  signature: string
}

const signatureFields = new Set(['signature', 'hmac', 'mac', 'digest', 'auth', 'eventSignature', 'revocationSignature'])

const stripSignatureFields = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map((item) => stripSignatureFields(item))
  if (!isRecord(value)) return value
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(value)) {
    if (!signatureFields.has(key)) result[key] = stripSignatureFields(value[key])
  }
  return result
}

const canonical = (value: unknown): string => {
  if (value === undefined) return 'null'
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => canonical(item)).join(',')}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).filter((key) => record[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(',')}}`
}

const extractSignature = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    const normalized = value.trim().replace(/^(?:hmac(?:-sha256)?|sha256)\s*[:=]?\s*/iu, '')
    return normalized.length > 0 ? normalized : undefined
  }
  if (!isRecord(value)) return undefined
  for (const key of ['signature', 'hmac', 'mac', 'digest', 'value', 'eventSignature']) {
    const extracted = extractSignature(value[key])
    if (extracted) return extracted
  }
  return undefined
}

const decodeSignature = (value: string): Buffer | undefined => {
  const normalized = value.replace(/^sha256=/iu, '').trim()
  if (/^[a-f0-9]+$/iu.test(normalized) && normalized.length % 2 === 0) return Buffer.from(normalized, 'hex')
  const base64 = normalized.replace(/-/gu, '+').replace(/_/gu, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const decoded = Buffer.from(padded, 'base64')
  return decoded.length === 32 ? decoded : undefined
}

const signatureMatches = (secret: string, value: string, signature: string): boolean => {
  const provided = decodeSignature(signature)
  if (!provided) return false
  const expected = createHmac('sha256', secret).update(value, 'utf8').digest()
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}

const DEVICE_KID_PREFIX = 'dev-'
const DEVICE_ALGORITHMS = new Set(['ES256', 'RS256', 'EdDSA'])

export class AttendanceSignatureService {
  private readonly config: ServiceConfig
  private readonly repository: DoorRepository
  private readonly deviceKeyCache = new Map<string, Promise<JWK | null>>()

  constructor(_keys: KeyService, config: ServiceConfig, repository: DoorRepository) {
    this.config = config
    this.repository = repository
  }

  async verify(rawEvent: Record<string, unknown>, businessId?: string): Promise<VerifiedAttendanceSignature> {
    const signature = extractSignature(rawEvent.signature) ?? extractSignature(rawEvent.signedEvent) ?? extractSignature(rawEvent.jws) ?? extractSignature(rawEvent.hmac) ?? extractSignature(rawEvent.token)
    if (!signature) throw new BadRequestError('Cada evento debe incluir una firma válida')
    if (signature.split('.').length === 3) {
      const header = this.decodeHeader(signature)
      const kid = optionalString(header.kid)
      if (kid?.startsWith(DEVICE_KID_PREFIX)) {
        return this.verifyDeviceSignature(signature, header, kid, businessId)
      }
      throw new UnauthorizedError('La firma del evento debe provenir de un dispositivo registrado (dev-*)')
    }
    const secret = this.config.attendanceHmacSecret
    if (!secret) throw new ServiceUnavailableError('La clave de firma de eventos no está configurada')
    const outer = { ...rawEvent }
    const nested = isRecord(rawEvent.event) ? { ...rawEvent.event } : undefined
    const source = nested ? { ...outer, ...nested } : outer
    const stripped = stripSignatureFields(source)
    if (!isRecord(stripped)) throw new BadRequestError('El cuerpo del evento no es válido')
    const canonicalPayload = canonical(stripped)
    if (!signatureMatches(secret, canonicalPayload, signature)) {
      throw new UnauthorizedError('La firma del evento no es válida')
    }
    return { payload: stripped, signature }
  }

  private decodeHeader(token: string): Record<string, unknown> {
    try {
      return decodeProtectedHeader(token) as Record<string, unknown>
    } catch {
      throw new UnauthorizedError('Firma no válida')
    }
  }

  private async verifyDeviceSignature(
    signature: string,
    header: Record<string, unknown>,
    kid: string,
    businessId?: string
  ): Promise<VerifiedAttendanceSignature> {
    const alg = optionalString(header.alg) ?? 'ES256'
    if (!DEVICE_ALGORITHMS.has(alg)) throw new UnauthorizedError('Algoritmo de firma de terminal no permitido')
    if (!businessId) throw new UnauthorizedError('DEVICE_NOT_ENROLLED')
    const jwk = await this.loadDeviceKey(businessId, kid)
    if (!jwk) throw new UnauthorizedError('DEVICE_NOT_ENROLLED')
    try {
      const key = await importJWK(jwk, alg)
      if (key instanceof Uint8Array) throw new Error('Invalid device key')
      const result = await compactVerify(signature, key, { algorithms: [alg] })
      const payload: unknown = JSON.parse(new TextDecoder().decode(result.payload))
      if (!isRecord(payload)) throw new Error('Invalid device payload')
      return {
        payload,
        header: result.protectedHeader as Record<string, unknown>,
        signature
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error
      throw new UnauthorizedError('DEVICE_SIGNATURE_INVALID')
    }
  }

  private loadDeviceKey(businessId: string, kid: string): Promise<JWK | null> {
    const cacheKey = `${businessId}:${kid}`
    const cached = this.deviceKeyCache.get(cacheKey)
    if (cached) return cached
    const pending = this.repository.getDeviceKey(businessId, kid)
      .then((record) => {
        if (!record || record.active === false) return null
        return record.publicKey as JWK
      })
      .catch(() => null)
    this.deviceKeyCache.set(cacheKey, pending)
    pending.then((result) => {
      if (result === null) this.deviceKeyCache.delete(cacheKey)
    }).catch(() => this.deviceKeyCache.delete(cacheKey))
    return pending
  }
}
