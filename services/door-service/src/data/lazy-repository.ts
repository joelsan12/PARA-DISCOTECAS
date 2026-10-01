import type { Firestore } from 'firebase-admin/firestore'
import { ServiceUnavailableError } from '../errors.js'
import { FirebaseRuntime } from '../firebase.js'
import { FirestoreDoorRepository } from './firestore-repository.js'
import type { AttendanceCommitInput, AttendanceCommitResult, CustomerRecord, DeviceKeyRecord, DoorRepository, EventRecord, RevocationRecord, StaffRecord, TicketRecord } from '../types.js'

export class LazyFirestoreDoorRepository implements DoorRepository {
  private readonly runtime: FirebaseRuntime
  private delegate: FirestoreDoorRepository | undefined

  constructor(runtime: FirebaseRuntime) {
    this.runtime = runtime
  }

  async getStaff(businessId: string, uid: string): Promise<StaffRecord | null> {
    return this.getDelegate().getStaff(businessId, uid)
  }

  async getCustomer(businessId: string, uid: string): Promise<CustomerRecord | null> {
    return this.getDelegate().getCustomer(businessId, uid)
  }

  async getTicket(businessId: string, ticketId: string): Promise<TicketRecord | null> {
    return this.getDelegate().getTicket(businessId, ticketId)
  }

  async getEvent(businessId: string, eventId: string): Promise<EventRecord | null> {
    return this.getDelegate().getEvent(businessId, eventId)
  }

  async getRevocations(businessId: string, eventId?: string, deviceId?: string): Promise<RevocationRecord[]> {
    return this.getDelegate().getRevocations(businessId, eventId, deviceId)
  }

  async getDeviceKey(businessId: string, kid: string): Promise<DeviceKeyRecord | null> {
    return this.getDelegate().getDeviceKey(businessId, kid)
  }

  async putDeviceKey(record: DeviceKeyRecord): Promise<void> {
    return this.getDelegate().putDeviceKey(record)
  }

  async commitAttendance(input: AttendanceCommitInput): Promise<AttendanceCommitResult> {
    return this.getDelegate().commitAttendance(input)
  }

  async commitAttendanceBatch(inputs: AttendanceCommitInput[]): Promise<AttendanceCommitResult[]> {
    return this.getDelegate().commitAttendanceBatch(inputs)
  }

  private getDelegate(): FirestoreDoorRepository {
    if (!this.delegate) {
      let db: Firestore
      try {
        db = this.runtime.getFirestore()
      } catch {
        throw new ServiceUnavailableError('Firestore Admin no está configurado')
      }
      this.delegate = new FirestoreDoorRepository(db)
    }
    return this.delegate
  }
}
