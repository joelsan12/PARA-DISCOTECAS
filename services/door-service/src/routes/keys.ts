import { Router } from 'express'
import { assertSafeId } from '../utils/values.js'
import type { KeyService } from '../services/key-service.js'

export const createKeysRouter = (keys: KeyService): Router => {
  const router = Router()
  router.get('/v1/keys/:kid', async (request, response, next) => {
    try {
      const kid = assertSafeId(request.params.kid, 'kid')
      response.status(200).json(await keys.getPublicJwk(kid))
    } catch (error) {
      next(error)
    }
  })
  return router
}
