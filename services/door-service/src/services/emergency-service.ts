import { isoFromMillis } from '../utils/values.js'
import type { DoorRepository, EmergencyStatus, RevocationRecord } from '../types.js'

export interface EmergencyCheckResult {
  allowed: boolean
  reason?: string
  status: EmergencyStatus
}

export class EmergencyService {
  private readonly repository: DoorRepository

  constructor(repository: DoorRepository) {
    this.repository = repository
  }

  async getStatus(businessId: string, eventId?: string, deviceId?: string): Promise<EmergencyStatus> {
    const records = await this.repository.getRevocations(businessId, eventId, deviceId)
    return this.summarize(businessId, eventId, deviceId, records)
  }

  async check(
    businessId: string,
    eventId: string,
    deviceId: string,
    tokenRevocationVersion: number,
    occurredAt: number
  ): Promise<EmergencyCheckResult> {
    const status = await this.getStatus(businessId, eventId, deviceId)
    if (status.eventCanceled) {
      return { allowed: false, reason: 'EVENT_CANCELED', status }
    }
    if (status.revocationVersion > tokenRevocationVersion) {
      return { allowed: false, reason: 'TOKEN_REVOKED', status }
    }
    if (status.revokedBefore !== undefined && occurredAt <= status.revokedBefore) {
      return { allowed: false, reason: 'EVENT_REVOKED_BEFORE', status }
    }
    return { allowed: true, status }
  }

  private summarize(businessId: string, eventId: string | undefined, deviceId: string | undefined, records: RevocationRecord[]): EmergencyStatus {
    const relevant = records.filter((record) => this.isRelevant(record, eventId, deviceId))
    const revocationVersion = relevant.reduce((highest, record) => Math.max(highest, record.revocationVersion), 0)
    const revokedBeforeValues = relevant.flatMap((record) => record.revokedBefore === undefined ? [] : [record.revokedBefore])
    const revokedBefore = revokedBeforeValues.length > 0 ? Math.max(...revokedBeforeValues) : undefined
    const eventCanceled = relevant.some((record) => record.eventCanceled)
    const latest = [...relevant].sort((left, right) => {
      const leftTime = typeof left.raw.createdAt === 'string' ? Date.parse(left.raw.createdAt) : 0
      const rightTime = typeof right.raw.createdAt === 'string' ? Date.parse(right.raw.createdAt) : 0
      return rightTime - leftTime
    })[0]
    const active = eventCanceled || relevant.length > 0

    return {
      businessId,
      eventId,
      deviceId,
      active,
      eventCanceled,
      revocationVersion,
      revokedBefore,
      reason: latest ? this.reasonOf(latest) : undefined,
      actorUid: latest ? this.actorOf(latest) : undefined,
      createdAt: latest ? this.createdAtOf(latest) : undefined,
      records: relevant
    }
  }

  private isRelevant(record: RevocationRecord, eventId: string | undefined, deviceId: string | undefined): boolean {
    if (record.scope === 'BUSINESS') return true
    if (record.scope === 'EVENT' && eventId && record.eventId && record.eventId !== eventId) return false
    if (record.scope === 'DEVICE' && deviceId && record.deviceId && record.deviceId !== deviceId) return false
    return true
  }

  private reasonOf(record: RevocationRecord): string | undefined {
    const reason = record.raw.reason
    return typeof reason === 'string' && reason.length > 0 ? reason : undefined
  }

  private actorOf(record: RevocationRecord): string | undefined {
    const actor = record.raw.actorUid ?? record.raw.actor_uid ?? record.raw.actor
    return typeof actor === 'string' && actor.length > 0 ? actor : undefined
  }

  private createdAtOf(record: RevocationRecord): string | undefined {
    const value = record.raw.createdAt ?? record.raw.created_at
    if (typeof value === 'string') return value
    if (typeof value === 'number') return isoFromMillis(value > 10_000_000_000 ? value : value * 1000)
    return undefined
  }
}
