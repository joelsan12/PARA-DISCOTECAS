export interface ServiceConfig {
  port: number
  issuer: string
  audience: string
  attendanceHmacSecret?: string
  keyId: string
  bucketSeconds: number
  tokenLifetimeSeconds: number
  allowedOrigins: string[]
  firebaseProjectId?: string
  firebaseEmulatorHost?: string
  authEmulatorHost?: string
  maxBatchSize: number
  clockSkewSeconds: number
  rateLimitWindowSeconds: number
  rateLimitMaxRequests: number
}

const readPositiveInteger = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback
}

const readOrigins = (env: NodeJS.ProcessEnv): string[] => {
  const raw = env.DOOR_ALLOWED_ORIGINS ?? env.CORS_ALLOWED_ORIGINS ?? env.ALLOWED_ORIGINS ?? ''
  return [...new Set(raw.split(',').map((origin) => origin.trim()).filter((origin) => origin.length > 0 && origin !== '*'))]
}

export const loadConfig = (env: NodeJS.ProcessEnv = process.env): ServiceConfig => {
  const projectId = env.FIREBASE_PROJECT_ID ?? env.GOOGLE_CLOUD_PROJECT ?? env.GCLOUD_PROJECT

  return {
    port: readPositiveInteger(env.PORT, 8080),
    issuer: env.DOOR_ISSUER ?? env.JWT_ISSUER ?? 'nightflow',
    audience: env.DOOR_AUDIENCE ?? env.JWT_AUDIENCE ?? 'nightflow-door',
    attendanceHmacSecret: env.ATTENDANCE_HMAC_SECRET ?? env.ATTENDANCE_EVENT_SECRET ?? env.DOOR_EVENT_HMAC_SECRET ?? env.DOOR_HMAC_SECRET ?? env.EDGE_HMAC_SECRET ?? env.EDGE_GATEWAY_HMAC_SECRET,
    keyId: env.DOOR_KEY_ID ?? env.DOOR_SIGNING_KEY_ID ?? env.SIGNING_KEY_ID ?? env.KEY_ID ?? 'nightflow-door-1',
    bucketSeconds: 30,
    tokenLifetimeSeconds: 45,
    allowedOrigins: readOrigins(env),
    firebaseProjectId: projectId,
    firebaseEmulatorHost: env.FIRESTORE_EMULATOR_HOST,
    authEmulatorHost: env.FIREBASE_AUTH_EMULATOR_HOST,
    maxBatchSize: 100,
    clockSkewSeconds: readPositiveInteger(env.DOOR_CLOCK_SKEW_SECONDS, 5),
    rateLimitWindowSeconds: readPositiveInteger(env.DOOR_RATE_LIMIT_WINDOW_SECONDS, 60),
    rateLimitMaxRequests: readPositiveInteger(env.DOOR_RATE_LIMIT_MAX_REQUESTS, 120)
  }
}
