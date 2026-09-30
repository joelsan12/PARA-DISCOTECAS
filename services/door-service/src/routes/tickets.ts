import { Router } from 'express'
import { getBusinessContext, getCallerContext } from '../middleware/auth.js'
import type { TicketService } from '../services/ticket-service.js'
import { isRecord } from '../utils/values.js'
import { BadRequestError } from '../errors.js'

export const createTicketsRouter = (tickets: TicketService): Router => {
  const router = Router()
  router.post('/v1/tickets/rotate', async (request, response, next) => {
    try {
      const body = isRecord(request.body) ? request.body : undefined
      if (!body) throw new BadRequestError('El body debe ser un objeto')
      const caller = getCallerContext(response)
      const result = await tickets.rotate(getBusinessContext(response), body, caller)
      response.status(200).json(result)
    } catch (error) {
      next(error)
    }
  })
  return router
}
