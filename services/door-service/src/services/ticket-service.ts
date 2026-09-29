import { BadRequestError, ConflictError } from '../errors.js'
import { assertSafeId, integerValue, optionalString } from '../utils/values.js'
import type { ServiceConfig } from '../config.js'
import type { DoorRepository, RotateTicketRequest, TokenClaims } from '../types.js'
import { EmergencyService } from './emergency-service.js'
import { KeyService } from './key-service.js'

export class TicketService {
  private readonly repository: DoorRepository
  private readonly keys: KeyService
  private readonly emergency: EmergencyService
  private readonly config: ServiceConfig

  constructor(repository: DoorRepository, keys: KeyService, emergency: EmergencyService, config: ServiceConfig) {
    this.repository = repository
    this.keys = keys
    this.emergency = emergency
    this.config = config
  }

  async rotate(businessId: string, input: RotateTicketRequest): Promise<{ token: string; kid: string; claims: TokenClaims; expiresIn: number }> {
    const ticketId = assertSafeId(optionalString(input.ticketId) ?? optionalString(input.ticket_id), 'ticketId')
    const deviceId = assertSafeId(optionalString(input.deviceId) ?? optionalString(input.device_id), 'deviceId')
    const ticket = await this.repository.getTicket(businessId, ticketId)
    const eventId = assertSafeId(optionalString(input.eventId) ?? optionalString(input.event_id) ?? ticket?.eventId, 'eventId')
    const event = await this.repository.getEvent(businessId, eventId)
    const venueId = assertSafeId(optionalString(input.venueId) ?? optionalString(input.venue_id) ?? event?.venueId ?? ticket?.venueId, 'venueId')
    const requestedVersion = integerValue(input.revocationVersion ?? input.revocation_version)
    if ((input.revocationVersion !== undefined || input.revocation_version !== undefined) && requestedVersion === undefined) throw new BadRequestError('revocationVersion no es válido')
    const revocationVersion = Math.max(requestedVersion ?? 0, ticket?.revocationVersion ?? 0, event?.revocationVersion ?? 0)
    const subject = assertSafeId(optionalString(input.subject) ?? optionalString(input.customerUid) ?? optionalString(input.customer_uid) ?? optionalString(input.uid) ?? ticket?.customerUid ?? ticketId, 'sub')

    if (ticket?.revoked || ticket?.eventCanceled) {
      throw new ConflictError('El ticket está revocado o cancelado', ticket?.eventCanceled ? 'EVENT_CANCELED' : 'TICKET_REVOKED')
    }
    if (event?.canceled) {
      throw new ConflictError('El evento está cancelado', 'EVENT_CANCELED')
    }
    if (ticket?.deviceId && ticket.deviceId !== deviceId) {
      throw new ConflictError('El dispositivo no coincide con el ticket', 'DEVICE_MISMATCH')
    }
    if (ticket?.eventId && ticket.eventId !== eventId) {
      throw new ConflictError('El evento no coincide con el ticket', 'EVENT_MISMATCH')
    }
    if (event?.venueId && event.venueId !== venueId) {
      throw new ConflictError('El venue no coincide con el evento', 'VENUE_MISMATCH')
    }
    if (requestedVersion !== undefined && requestedVersion < (ticket?.revocationVersion ?? 0)) {
      throw new ConflictError('La versión de revocación está obsoleta', 'TOKEN_REVOKED')
    }

    if (input.currentToken !== undefined) {
      if (typeof input.currentToken !== 'string' || input.currentToken.length === 0) {
        throw new BadRequestError('currentToken no es válido')
      }
      const currentClaims = await this.keys.verifyJwt(input.currentToken)
      if (currentClaims.businessId !== businessId || currentClaims.eventId !== eventId || currentClaims.venueId !== venueId || currentClaims.ticketId !== ticketId || currentClaims.deviceId !== deviceId) {
        throw new ConflictError('El token actual no corresponde al ticket', 'TOKEN_MISMATCH')
      }
    }

    const emergencyStatus = await this.emergency.getStatus(businessId, eventId, deviceId)
    if (emergencyStatus.eventCanceled) {
      throw new ConflictError('El evento está cancelado', 'EVENT_CANCELED')
    }
    if (emergencyStatus.revocationVersion > revocationVersion) {
      throw new ConflictError('La versión de revocación está obsoleta', 'TOKEN_REVOKED')
    }
    if (emergencyStatus.revokedBefore !== undefined) {
      throw new ConflictError('La credencial está revocada', 'EVENT_REVOKED')
    }

    const result = await this.keys.signTicketClaims({
      sub: subject,
      businessId,
      eventId,
      venueId,
      ticketId,
      deviceId,
      revocationVersion
    })
    return { ...result, expiresIn: this.config.tokenLifetimeSeconds }
  }
}
