import { createHash } from 'node:crypto'
import type { Request } from 'express'
import { BadRequestError } from '../errors.js'

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export const assertSafeId = (value: unknown, field: string): string => {
  if (typeof value !== 'string') {
    throw new BadRequestError(`${field} debe ser un string`)
  }
  const normalized = value.trim()
  const hasControlCharacter = [...normalized].some((character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127
  })
  if (normalized.length === 0 || normalized.length > 256 || normalized.includes('/') || normalized.includes('\\') || hasControlCharacter) {
    throw new BadRequestError(`${field} no es válido`)
  }
  return normalized
}

export const optionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

export const numberValue = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export const integerValue = (value: unknown): number | undefined => {
  const parsed = numberValue(value)
  return parsed !== undefined && Number.isSafeInteger(parsed) ? parsed : undefined
}

export const booleanValue = (value: unknown): boolean | undefined => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number' && (value === 0 || value === 1)) return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'active', 'enabled'].includes(normalized)) return true
    if (['false', '0', 'no', 'inactive', 'disabled'].includes(normalized)) return false
  }
  return undefined
}

export const dateMillis = (value: unknown): number | undefined => {
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isFinite(time) ? time : undefined
  }
  if (typeof value === 'object' && value !== null && 'toMillis' in value) {
    const candidate = value as { toMillis?: () => unknown }
    if (typeof candidate.toMillis === 'function') {
      const time = numberValue(candidate.toMillis())
      return time
    }
  }
  const numeric = numberValue(value)
  if (numeric !== undefined) {
    if (numeric > 10_000_000_000) return numeric
    if (numeric > 1_000_000_000) return numeric * 1000
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export const isoFromMillis = (value: number | undefined): string | undefined => {
  return value === undefined ? undefined : new Date(value).toISOString()
}

export const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`
  const record = value as Record<string, unknown>
  const entries = Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
  return `{${entries.join(',')}}`
}

export const hashValue = (value: unknown): string => createHash('sha256').update(canonicalJson(value)).digest('hex')

export const safeDocumentId = (value: string): string => {
  if (/^[A-Za-z0-9_-]{1,128}$/u.test(value)) return value
  return createHash('sha256').update(value).digest('hex')
}

export const getHeaderValue = (request: Request, name: string): string | undefined => {
  const value = request.headers[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}
