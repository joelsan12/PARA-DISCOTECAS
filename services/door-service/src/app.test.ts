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
