import { Router } from 'express'
import { getBusinessContext } from '../middleware/auth.js'
import type { AttendanceService } from '../services/attendance-service.js'
import { BadRequestError } from '../errors.js'
import { isRecord } from '../utils/values.js'

export const createAttendanceRouter = (attendance: AttendanceService): Router => {
  const router = Router()
  router.post('/v1/attendance/sync', async (request, response, next) => {
    try {
      const body = isRecord(request.body) ? request.body : undefined
      const events = Array.isArray(request.body)
        ? request.body
        : Array.isArray(body?.events)
          ? body.events
          : body
            ? [body]
            : undefined
      if (!Array.isArray(events)) throw new BadRequestError('events debe ser un array')
      const result = await attendance.sync(getBusinessContext(response), events)
      const status = result.conflicts > 0 ? 409 : result.accepted === 0 && result.rejected > 0 ? 403 : 200
      response.status(status).json(result)
    } catch (error) {
      next(error)
    }
  })
  return router
}
