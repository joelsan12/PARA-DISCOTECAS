import express, { type Express } from 'express'
import type { ServiceConfig } from './config.js'
import { loadConfig } from './config.js'
import { FirebaseRuntime } from './firebase.js'
import { createCorsMiddleware, requireAllowedOrigin } from './middleware/cors.js'
import { createAuthenticationMiddleware, createBusinessAuthorizationMiddleware } from './middleware/auth.js'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import { createHealthRouter } from './routes/health.js'
import { createKeysRouter } from './routes/keys.js'
import { createTicketsRouter } from './routes/tickets.js'
import { createAttendanceRouter } from './routes/attendance.js'
import { createEmergencyRouter } from './routes/emergency.js'
import { createDevicesRouter } from './routes/devices.js'
import { FirebaseAuthService, type IdTokenVerifier } from './services/auth-service.js'
import { StaffAuthorizer } from './services/staff-authorizer.js'
import { KeyService } from './services/key-service.js'
import { EmergencyService } from './services/emergency-service.js'
import { TicketService } from './services/ticket-service.js'
import { AttendanceSignatureService } from './services/attendance-signature-service.js'
import { AttendanceService } from './services/attendance-service.js'
import { LazyFirestoreDoorRepository } from './data/lazy-repository.js'
import type { DoorRepository } from './types.js'

export interface AppDependencies {
  env?: NodeJS.ProcessEnv
  config?: ServiceConfig
  runtime?: FirebaseRuntime
  repository?: DoorRepository
  keyService?: KeyService
  authService?: IdTokenVerifier
  emergencyService?: EmergencyService
}

export const createApp = (dependencies: AppDependencies = {}): Express => {
  const env = dependencies.env ?? process.env
  const config = dependencies.config ?? loadConfig(env)
  const runtime = dependencies.runtime ?? new FirebaseRuntime(env)
  const repository = dependencies.repository ?? new LazyFirestoreDoorRepository(runtime)
  const keys = dependencies.keyService ?? new KeyService(env, config)
  const authService = dependencies.authService ?? new FirebaseAuthService(runtime)
  const emergency = dependencies.emergencyService ?? new EmergencyService(repository)
  const signatures = new AttendanceSignatureService(keys, config, repository)
  const authorizer = new StaffAuthorizer(repository)
  const tickets = new TicketService(repository, keys, emergency, config)
  const attendance = new AttendanceService(repository, signatures, emergency, config)
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', false)
  app.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })
  app.use(createCorsMiddleware(config))
  app.use(requireAllowedOrigin(config))
  app.use(express.json({ limit: '128kb', strict: true }))
  app.use(createHealthRouter(runtime))
  app.use(createKeysRouter(keys))

  const authenticate = createAuthenticationMiddleware(authService)
  const authorizeBusiness = createBusinessAuthorizationMiddleware(authorizer)
  app.use('/v1', authenticate, authorizeBusiness)
  app.use(createDevicesRouter(repository))
  app.use(createTicketsRouter(tickets))
  app.use(createAttendanceRouter(attendance))
  app.use(createEmergencyRouter(emergency))
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

