import { Router } from 'express'
import type { FirebaseRuntime } from '../firebase.js'

export const createHealthRouter = (runtime: FirebaseRuntime): Router => {
  const router = Router()
  router.get('/health', (_request, response) => {
    response.status(200).json({
      ok: true,
      status: 'ok',
      service: 'door-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dependencies: {
        firebase: runtime.isConfigured() ? 'configured' : 'unconfigured'
      }
    })
  })
  return router
}
