import assert from 'node:assert/strict'
import test from 'node:test'
import { createApp } from './app.js'
import { loadConfig } from './config.js'

const withServer = async (run: (baseUrl: string) => Promise<void>): Promise<void> => {
  const app = createApp({ env: {}, config: loadConfig({}) })
  const server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address()
  assert.ok(address && typeof address === 'object')
  try {
    await run(`http://127.0.0.1:${address.port}`)
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

test('health responde sin dependencias', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`)
    assert.equal(response.status, 200)
    const body = await response.json() as { status: string }
    assert.equal(body.status, 'ok')
  })
})

test('keys devuelve 503 cuando no hay clave', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/keys/door-1`)
    assert.equal(response.status, 503)
  })
})

test('endpoint protegido devuelve 503 sin Firebase', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/tickets/rotate`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer missing',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ businessId: 'business-1' })
    })
    assert.equal(response.status, 503)
  })
})

test('CORS no permite origen no configurado', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`, { headers: { Origin: 'https://untrusted.example' } })
    assert.equal(response.status, 403)
  })
})

test('rotate con cliente activo devuelve 200 y rota el pase (hueco A)', async () => {
  const { KeyService } = await import('./services/key-service.js')
  const businessId = 'club_test_rotate'
  const eventId = 'evt_test_01'
  const ticketId = 'tkt_cust_01'
  const customerUid = 'cust_vip_user'

  const mockRepo = {
    customers: new Map(),
    staff: new Map(),
    tickets: new Map(),
    events: new Map(),
    async getCustomer(b: string, uid: string) { return this.customers.get(`${b}:${uid}`) ?? null },
    async getStaff(b: string, uid: string) { return this.staff.get(`${b}:${uid}`) ?? null },
    async getTicket(b: string, tid: string) { return this.tickets.get(`${b}:${tid}`) ?? null },
    async getEvent(b: string, eid: string) { return this.events.get(`${b}:${eid}`) ?? null },
    async getRevocations() { return [] },
    async getDeviceKey() { return null },
    async putDeviceKey() {},
    async commitAttendance() { return { status: 'ACCEPTED' as const, duplicate: false, stateBefore: 'ABSENT' as const, stateAfter: 'INSIDE' as const, reentryCount: 0 } }
  }

  mockRepo.customers.set(`${businessId}:${customerUid}`, {
    businessId,
    uid: customerUid,
    status: 'ACTIVE',
    active: true,
    raw: {}
  })
  mockRepo.events.set(`${businessId}:${eventId}`, {
    businessId,
    eventId,
    venueId: 'venue_1',
    canceled: false,
    revocationVersion: 0,
    raw: {}
  })
  mockRepo.tickets.set(`${businessId}:${ticketId}`, {
    businessId,
    ticketId,
    eventId,
    venueId: 'venue_1',
    customerUid,
    status: 'CONFIRMED',
    revoked: false,
    eventCanceled: false,
    revocationVersion: 0,
    raw: {}
  })

  const config = loadConfig({
    DOOR_KEY_ID: 'door-key-test',
    DOOR_PRIVATE_KEY_BASE64: 'MC4CAQAwBQYDK2VwBCIEIHrcrp269fz13XwffpVNDYEhOYXAE09RBPZsgLwS03wd',
    DOOR_PUBLIC_KEY: 'MCowBQYDK2VwAyEAI99TCPATDIAvjx/x6fAz+i6ZCIZytEPJQOFkrEfMcJg='
  })
  const keyService = new KeyService({
    DOOR_KEY_ID: 'door-key-test',
    DOOR_PRIVATE_KEY_BASE64: 'MC4CAQAwBQYDK2VwBCIEIHrcrp269fz13XwffpVNDYEhOYXAE09RBPZsgLwS03wd',
    DOOR_PUBLIC_KEY: 'MCowBQYDK2VwAyEAI99TCPATDIAvjx/x6fAz+i6ZCIZytEPJQOFkrEfMcJg='
  }, config)

  const authService = {
    async verifyIdToken(token: string) {
      return { uid: token, claims: {} }
    }
  }

  const app = createApp({
    config,
    repository: mockRepo as any,
    keyService,
    authService
  })

  const server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address() as any
  const baseUrl = `http://127.0.0.1:${address.port}`

  try {
    // 1. Cliente activo rota su pase -> 200
    const resSuccess = await fetch(`${baseUrl}/v1/tickets/rotate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerUid}`,
        'Content-Type': 'application/json',
        'x-business-id': businessId
      },
      body: JSON.stringify({ ticketId, deviceId: 'dev_cust_mobile_1' })
    })
    assert.equal(resSuccess.status, 200)
    const bodySuccess = await resSuccess.json() as any
    assert.ok(bodySuccess.token)
    assert.equal(bodySuccess.claims.ticketId, ticketId)

    // 2. Usuario sin staff ni cliente activo -> 403
    const resStranger = await fetch(`${baseUrl}/v1/tickets/rotate`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer stranger_uid',
        'Content-Type': 'application/json',
        'x-business-id': businessId
      },
      body: JSON.stringify({ ticketId, deviceId: 'dev_cust_mobile_1' })
    })
    assert.equal(resStranger.status, 403)

    // 3. Cliente intenta acceder a attendance/sync (staff-only) -> 403
    const resAttendanceDenied = await fetch(`${baseUrl}/v1/attendance/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customerUid}`,
        'Content-Type': 'application/json',
        'x-business-id': businessId
      },
      body: JSON.stringify({ events: [] })
    })
    assert.equal(resAttendanceDenied.status, 403)
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()))
  }
})
