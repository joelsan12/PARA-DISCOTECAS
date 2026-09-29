import { ForbiddenError } from '../errors.js'
import type { AuthenticatedUser, DoorRepository, StaffRecord } from '../types.js'

export class StaffAuthorizer {
  private readonly repository: DoorRepository

  constructor(repository: DoorRepository) {
    this.repository = repository
  }

  async authorize(businessId: string, user: AuthenticatedUser): Promise<StaffRecord> {
    const staff = await this.repository.getStaff(businessId, user.uid)
    if (!staff || !staff.active) {
      throw new ForbiddenError()
    }
    const staffBusinessId = typeof staff.raw.businessId === 'string' ? staff.raw.businessId : typeof staff.raw.business_id === 'string' ? staff.raw.business_id : undefined
    if (staffBusinessId !== undefined && staffBusinessId !== businessId) {
      throw new ForbiddenError()
    }
    return staff
  }
}
