import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { KeyService } from './services/key-service.js'

const BUSINESS_ID = 'club_roles_test'
const DOOR_ENV = {
  DOOR_KEY_ID: 'door-key-test',
  DOOR_PRIVATE_KEY_BASE64: 'MC4CAQAwBQYDK2VwBCIEIHrcrp269fz13XwffpVNDYEhOYXAE09RBPZsgLwS03wd',
  DOOR_PUBLIC_KEY: 'MCowBQYDK2VwAyEAI99TCPATDIAvjx/x6fAz+i6ZCIZytEPJQOFkrEfMcJg='
}

interface Harness {
  baseUrl: string
  close: () => Promise<void>
}

const makeRepository = (roles: Record<string, string>) => {
  const staff = new Map<string, unknown>()
  for (const [uid, role] of Object.entries(roles)) {
    staff.set(`${BUSINESS_ID}:${uid}`, {
      businessId: BUSINESS_ID,
      uid,
      role,
      status: 'ACTIVE',
      active: true,
      raw: { businessId: BUSINESS_ID, role }
    })
  }
  const enrolled: unknown[] = []
  return {
    enrolled,
    repository: {
      customers: new Map(),
      staff,
      tickets: new Map(),
      events: new Map(),
      async getCustomer() { return null },
      async getStaff(business: string, uid: string) { return this.staff.get(`${business}:${uid}`) ?? null },
      async getTicket() { return null },
      async getEvent() { return null },
      async getRevocations() { return [] },
      async getDeviceKey() { return null },
      async putDeviceKey(record: unknown) { enrolled.push(record) },
      async commitAttendance() {
        return { status: 'ACCEPTED' as const, duplicate: false, stateBefore: 'ABSENT' as const, stateAfter: 'INSIDE' as const, reentryCount: 0 }
      }
    }
  }
}

const startHarness = async (roles: Record<string, string>, env: Record<string, string> = {}): Promise<Harness & { enrolled: unknown[] }> => {
  const config = loadConfig({ ...DOOR_ENV, ...env })
  const { repository, enrolled } = makeRepository(roles)
  const app = createApp({
    config,
    repository: repository as never,
    keyService: new KeyService(DOOR_ENV, config),
    authService: { async verifyIdToken(token: string) { return { uid: token, claims: {} } } }
  })
  const server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address() as { port: number }
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    enrolled,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
}

const enrollBody = JSON.stringify({
  kid: 'dev-terminal-1',
  deviceId: 'dev-terminal-1',
  publicKey: { kty: 'EC', crv: 'P-256', x: 'abc', y: 'def' }
})

const call = (baseUrl: string, path: string, uid: string, body?: unknown): Promise<Response> => fetch(`${baseUrl}${path}`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${uid}`,
    'Content-Type': 'application/json',
    'x-business-id': BUSINESS_ID
  },
  ...(body === undefined ? {} : { body: JSON.stringify(body) })
})

test('C5: enrolar una terminal exige gerencia, no cualquier staff activo', async () => {
  const harness = await startHarness({ finance_uid: 'finance', door_uid: 'door', manager_uid: 'manager', owner_uid: 'owner' })
  try {
    for (const uid of ['finance_uid', 'door_uid']) {
      const response = await call(harness.baseUrl, '/v1/devices/enroll', uid, JSON.parse(enrollBody))
      assert.equal(response.status, 403, `${uid} no debe enrolar terminales`)
    }
    assert.equal(harness.enrolled.length, 0, 'ningun rol inferior a manager debe escribir la llave')

    for (const uid of ['manager_uid', 'owner_uid']) {
      const response = await call(harness.baseUrl, '/v1/devices/enroll', uid, JSON.parse(enrollBody))
      assert.equal(response.status, 201, `${uid} si puede enrolar terminales`)
    }
    assert.equal(harness.enrolled.length, 2)
  } finally {
    await harness.close()
  }
})

test('C5: un rol desconocido no accede a ninguna ruta de staff', async () => {
  const harness = await startHarness({ strange_uid: 'superuser' })
  try {
    const enroll = await call(harness.baseUrl, '/v1/devices/enroll', 'strange_uid', JSON.parse(enrollBody))
    assert.equal(enroll.status, 403)
    const emergency = await call(harness.baseUrl, '/v1/emergency/status', 'strange_uid', {})
    assert.equal(emergency.status, 403)
    assert.equal(harness.enrolled.length, 0)
  } finally {
    await harness.close()
  }
})

test('C5: el estado de emergencia sigue disponible para roles de puerta', async () => {
  const harness = await startHarness({ door_uid: 'door' })
  try {
    const response = await call(harness.baseUrl, '/v1/emergency/status', 'door_uid', {})
    assert.equal(response.status, 200)
  } finally {
    await harness.close()
  }
})

test('C5: el abuso repetido contra la puerta se corta con 429', async () => {
  const harness = await startHarness({ door_uid: 'door' }, { DOOR_RATE_LIMIT_MAX_REQUESTS: '5' })
  try {
    const statuses: number[] = []
    for (let index = 0; index < 9; index += 1) {
      const response = await call(harness.baseUrl, '/v1/emergency/status', 'door_uid', {})
      statuses.push(response.status)
    }
    assert.equal(statuses.slice(0, 5).every((status) => status === 200), true, `primera cuota debe pasar: ${statuses.join(',')}`)
    assert.equal(statuses.slice(5).every((status) => status === 429), true, `el exceso debe cortarse: ${statuses.join(',')}`)

    const limited = await call(harness.baseUrl, '/v1/emergency/status', 'door_uid', {})
    assert.equal(limited.headers.get('retry-after') !== null, true, 'debe indicar Retry-After')

    const other = await call(harness.baseUrl, '/v1/emergency/status', 'manager_uid', {})
    assert.equal(other.status, 403, 'otro uid no hereda la cuota agotada')
  } finally {
    await harness.close()
  }
})