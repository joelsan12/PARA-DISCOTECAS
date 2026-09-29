import { randomUUID } from 'node:crypto'
import { compactVerify, decodeProtectedHeader, exportJWK, importJWK, importPKCS8, importSPKI, jwtVerify, SignJWT, type CryptoKey, type JWK, type JWTPayload } from 'jose'
import type { ServiceConfig } from '../config.js'
import { NotFoundError, ServiceUnavailableError, UnauthorizedError } from '../errors.js'
import { optionalString } from '../utils/values.js'
import type { TokenClaims } from '../types.js'

interface KeyDefinition {
  kid: string
  privateKey?: string
  publicKey?: string
  privateKeyBase64?: string
  publicKeyBase64?: string
  active?: boolean
}

interface LoadedKey {
  kid: string
  privateKey?: CryptoKey
  publicKey: CryptoKey
  active: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const decodeBase64 = (value: string): Buffer => {
  const normalized = value.replace(/\s+/gu, '')
  const decoded = Buffer.from(normalized, 'base64')
  if (decoded.length === 0) throw new Error('Empty base64 value')
  return decoded
}

const pemFromDer = (der: Buffer): string => {
  const body = der.toString('base64').replace(/(.{64})/gu, '$1\n').replace(/\n$/u, '')
  return `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`
}

const pkcs8PemFromDer = (der: Buffer): string => {
  const body = der.toString('base64').replace(/(.{64})/gu, '$1\n').replace(/\n$/u, '')
  return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`
}

const parseJsonKey = (value: string): JWK | undefined => {
  const normalized = value.trim()
  if (!normalized.startsWith('{')) return undefined
  const parsed: unknown = JSON.parse(normalized)
  if (!isRecord(parsed)) return undefined
  return parsed as JWK
}

export class KeyService {
  private readonly env: NodeJS.ProcessEnv
  private readonly config: ServiceConfig
  private keys = new Map<string, LoadedKey>()
  private activeKid: string | undefined
  private loaded = false
  private loadError: Error | undefined

  constructor(env: NodeJS.ProcessEnv, config: ServiceConfig) {
    this.env = env
    this.config = config
  }

  async getPublicJwk(kid: string): Promise<Record<string, unknown>> {
    await this.ensureLoaded()
    const key = this.keys.get(kid)
    if (!key) throw new NotFoundError('Clave no encontrada')
    const jwk = await exportJWK(key.publicKey)
    return {
      ...jwk,
      kid: key.kid,
      alg: 'EdDSA',
      use: 'sig'
    }
  }

  async hasPublicKey(kid: string): Promise<boolean> {
    await this.ensureLoaded()
    return this.keys.has(kid)
  }

  async signTicketClaims(input: Omit<TokenClaims, 'iss' | 'aud' | 'jti' | 'timeBucket' | 'iat' | 'nbf' | 'exp'> & { jti?: string }): Promise<{ token: string; claims: TokenClaims; kid: string }> {
    await this.ensureLoaded()
    const key = this.getActiveKey()
    if (!key.privateKey) {
      throw new ServiceUnavailableError('La clave privada de firma no está configurada')
    }

    const now = Math.floor(Date.now() / 1000)
    const timeBucket = Math.floor(now / this.config.bucketSeconds) * this.config.bucketSeconds
    const claims: TokenClaims = {
      iss: this.config.issuer,
      aud: this.config.audience,
      sub: input.sub,
      jti: input.jti ?? randomUUID(),
      businessId: input.businessId,
      eventId: input.eventId,
      venueId: input.venueId,
      ticketId: input.ticketId,
      deviceId: input.deviceId,
      revocationVersion: input.revocationVersion,
      timeBucket,
      iat: now,
      nbf: timeBucket - this.config.clockSkewSeconds,
      exp: now + this.config.tokenLifetimeSeconds
    }

    const token = await new SignJWT(claims as unknown as JWTPayload)
      .setProtectedHeader({ alg: 'EdDSA', kid: key.kid, typ: 'JWT' })
      .sign(key.privateKey)

    return { token, claims, kid: key.kid }
  }

  async verifyJwt(token: string): Promise<Record<string, unknown>> {
    const key = await this.resolveVerificationKey(token)
    try {
      const result = await jwtVerify(token, key, {
        issuer: this.config.issuer,
        audience: this.config.audience,
        clockTolerance: this.config.clockSkewSeconds
      })
      return result.payload as Record<string, unknown>
    } catch {
      throw new UnauthorizedError('El token firmado no es válido')
    }
  }

  async verifyCompactJws(token: string): Promise<{ payload: Record<string, unknown>; header: Record<string, unknown> }> {
    const key = await this.resolveVerificationKey(token)
    try {
      const result = await compactVerify(token, key, { algorithms: ['EdDSA'] })
      const payload: unknown = JSON.parse(new TextDecoder().decode(result.payload))
      if (!isRecord(payload)) throw new Error('Invalid JWS payload')
      return {
        payload,
        header: result.protectedHeader as Record<string, unknown>
      }
    } catch {
      throw new UnauthorizedError('La firma del evento no es válida')
    }
  }

  async getPublicKeyForVerification(kid: string): Promise<CryptoKey> {
    await this.ensureLoaded()
    const key = this.keys.get(kid)
    if (!key) throw new UnauthorizedError('La clave de verificación no es conocida')
    return key.publicKey
  }

  private async resolveVerificationKey(token: string): Promise<CryptoKey> {
    if (token.length === 0 || token.length > 16384) throw new UnauthorizedError('Firma no válida')
    let header: ReturnType<typeof decodeProtectedHeader>
    try {
      header = decodeProtectedHeader(token)
    } catch {
      throw new UnauthorizedError('Firma no válida')
    }
    if (header.alg !== 'EdDSA') throw new UnauthorizedError('Algoritmo de firma no permitido')
    const kid = optionalString(header.kid)
    if (!kid) throw new UnauthorizedError('La firma no incluye kid')
    return this.getPublicKeyForVerification(kid)
  }

  private getActiveKey(): LoadedKey {
    if (!this.activeKid) throw new ServiceUnavailableError('No hay una clave de firma activa')
    const key = this.keys.get(this.activeKid)
    if (!key || !key.active) throw new ServiceUnavailableError('No hay una clave de firma activa')
    return key
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    if (this.loadError) throw new ServiceUnavailableError('Las claves JWS no están disponibles')
    try {
      const definitions = this.readDefinitions()
      const loaded: LoadedKey[] = []
      for (const definition of definitions) {
        const key = await this.loadDefinition(definition)
        if (key) loaded.push(key)
      }
      if (loaded.length === 0) throw new Error('No public signing key configured')
      for (const key of loaded) this.keys.set(key.kid, key)
      const configuredActive = optionalString(this.env.DOOR_ACTIVE_KEY_ID) ?? optionalString(this.env.DOOR_SIGNING_ACTIVE_KEY_ID) ?? optionalString(this.env.ACTIVE_SIGNING_KEY_ID)
      this.activeKid = loaded.find((key) => key.kid === configuredActive && key.active)?.kid
        ?? loaded.find((key) => key.active)?.kid
      this.loaded = true
    } catch (error) {
      this.loadError = error instanceof Error ? error : new Error('Key loading failed')
      throw new ServiceUnavailableError('Las claves JWS no están disponibles')
    }
  }

  private readDefinitions(): KeyDefinition[] {
    const rawBundle = this.env.DOOR_SIGNING_KEYS ?? this.env.DOOR_KEYS ?? this.env.SIGNING_KEYS_JSON
    if (rawBundle) {
      const parsed: unknown = JSON.parse(rawBundle)
      if (Array.isArray(parsed)) return parsed.map((value) => this.definitionFromUnknown(value)).filter((value): value is KeyDefinition => value !== undefined)
      if (isRecord(parsed)) {
        const keys = Array.isArray(parsed.keys) ? parsed.keys : []
        const definitions = keys.map((value) => this.definitionFromUnknown(value)).filter((value): value is KeyDefinition => value !== undefined)
        const current = this.definitionFromUnknown(parsed.current)
        if (current) definitions.unshift(current)
        if (definitions.length > 0) return definitions
      }
    }

    const definitions: KeyDefinition[] = []
    const currentKid = optionalString(this.env.DOOR_KEY_ID) ?? optionalString(this.env.DOOR_SIGNING_KEY_ID) ?? optionalString(this.env.SIGNING_KEY_ID) ?? optionalString(this.env.KEY_ID) ?? this.config.keyId
    const privateKey = this.env.DOOR_PRIVATE_KEY_BASE64 ?? this.env.DOOR_PRIVATE_KEY_B64 ?? this.env.DOOR_SIGNING_PRIVATE_KEY_BASE64 ?? this.env.DOOR_SIGNING_PRIVATE_KEY_B64 ?? this.env.SIGNING_PRIVATE_KEY_BASE64 ?? this.env.PRIVATE_KEY_BASE64 ?? this.env.DOOR_ED25519_PRIVATE_KEY_BASE64 ?? this.env.DOOR_JWS_PRIVATE_KEY_BASE64 ?? this.env.DOOR_PRIVATE_KEY ?? this.env.DOOR_SIGNING_PRIVATE_KEY ?? this.env.SIGNING_PRIVATE_KEY
    const publicKey = this.env.DOOR_PUBLIC_KEY ?? this.env.DOOR_PUBLIC_KEY_B64 ?? this.env.DOOR_SIGNING_PUBLIC_KEY ?? this.env.DOOR_SIGNING_PUBLIC_KEY_B64 ?? this.env.SIGNING_PUBLIC_KEY ?? this.env.DOOR_PUBLIC_KEY_BASE64 ?? this.env.DOOR_SIGNING_PUBLIC_KEY_BASE64 ?? this.env.PUBLIC_KEY ?? this.env.PUBLIC_KEY_BASE64 ?? this.env.DOOR_ED25519_PUBLIC_KEY ?? this.env.DOOR_JWS_PUBLIC_KEY
    definitions.push({ kid: currentKid, privateKeyBase64: privateKey, publicKey, active: true })

    const previousRaw = this.env.DOOR_PREVIOUS_KEYS ?? this.env.DOOR_PREVIOUS_PUBLIC_KEYS ?? this.env.SIGNING_PREVIOUS_KEYS_JSON
    if (previousRaw) {
      const parsed: unknown = JSON.parse(previousRaw)
      const values = Array.isArray(parsed) ? parsed : [parsed]
      for (const value of values) {
        const definition = this.definitionFromUnknown(value)
        if (definition) definitions.push({ ...definition, active: false })
      }
    }

    const previousKid = optionalString(this.env.DOOR_PREVIOUS_KEY_ID) ?? optionalString(this.env.SIGNING_PREVIOUS_KEY_ID)
    const previousPublic = this.env.DOOR_PREVIOUS_PUBLIC_KEY ?? this.env.DOOR_PREVIOUS_PUBLIC_KEY_BASE64 ?? this.env.SIGNING_PREVIOUS_PUBLIC_KEY
    if (previousKid && previousPublic) definitions.push({ kid: previousKid, publicKey: previousPublic, active: false })

    return definitions
  }

  private definitionFromUnknown(value: unknown): KeyDefinition | undefined {
    if (!isRecord(value)) return undefined
    const kid = optionalString(value.kid) ?? optionalString(value.keyId)
    if (!kid) return undefined
    return {
      kid,
      privateKey: optionalString(value.privateKey) ?? optionalString(value.private_key),
      publicKey: optionalString(value.publicKey) ?? optionalString(value.public_key),
      privateKeyBase64: optionalString(value.privateKeyBase64) ?? optionalString(value.private_key_base64) ?? optionalString(value.privateKeyB64) ?? optionalString(value.private_key_b64),
      publicKeyBase64: optionalString(value.publicKeyBase64) ?? optionalString(value.public_key_base64) ?? optionalString(value.publicKeyB64) ?? optionalString(value.public_key_b64),
      active: value.active !== false
    }
  }

  private async loadDefinition(definition: KeyDefinition): Promise<LoadedKey | undefined> {
    const publicKey = await this.importPublic(definition.publicKey ?? definition.publicKeyBase64)
    const privateKey = await this.importPrivate(definition.privateKey ?? definition.privateKeyBase64)
    const effectivePublicKey = publicKey ?? (privateKey ? await this.publicFromPrivate(privateKey) : undefined)
    if (!effectivePublicKey) return undefined
    return { kid: definition.kid, privateKey, publicKey: effectivePublicKey, active: definition.active !== false }
  }

  private async importPrivate(value: string | undefined): Promise<CryptoKey | undefined> {
    if (!value) return undefined
    try {
      const decoded = this.decodeMaybeBase64(value)
      const jwk = parseJsonKey(decoded.toString('utf8'))
      if (jwk) {
        const imported = await importJWK(jwk, 'EdDSA', { extractable: true })
        if (imported instanceof Uint8Array) return undefined
        return imported
      }
      const text = decoded.toString('utf8')
      return text.includes('-----BEGIN') ? await importPKCS8(text, 'EdDSA', { extractable: true }) : await importPKCS8(pkcs8PemFromDer(decoded), 'EdDSA', { extractable: true })
    } catch {
      return undefined
    }
  }

  private async importPublic(value: string | undefined): Promise<CryptoKey | undefined> {
    if (!value) return undefined
    try {
      const decoded = this.decodeMaybeBase64(value)
      const text = decoded.toString('utf8')
      const jwk = parseJsonKey(text)
      if (jwk) {
        const imported = await importJWK(jwk, 'EdDSA')
        if (imported instanceof Uint8Array) return undefined
        return imported
      }
      if (text.includes('-----BEGIN')) return await importSPKI(text, 'EdDSA')
      if (decoded.length === 32) {
        const rawJwk: JWK = { kty: 'OKP', crv: 'Ed25519', alg: 'EdDSA', x: decoded.toString('base64url') }
        const imported = await importJWK(rawJwk, 'EdDSA')
        if (imported instanceof Uint8Array) return undefined
        return imported
      }
      return await importSPKI(pemFromDer(decoded), 'EdDSA')
    } catch {
      return undefined
    }
  }

  private decodeMaybeBase64(value: string): Buffer {
    const normalized = value.trim()
    if (normalized.startsWith('{') || normalized.includes('-----BEGIN')) return Buffer.from(normalized, 'utf8')
    try {
      return decodeBase64(normalized)
    } catch {
      return Buffer.from(normalized, 'utf8')
    }
  }

  private async publicFromPrivate(privateKey: CryptoKey): Promise<CryptoKey> {
    const jwk = await exportJWK(privateKey)
    const publicJwk: JWK = { ...jwk }
    delete publicJwk.d
    delete publicJwk.key_ops
    const imported = await importJWK(publicJwk, 'EdDSA')
    if (imported instanceof Uint8Array) throw new Error('Invalid public key')
    return imported
  }
}
