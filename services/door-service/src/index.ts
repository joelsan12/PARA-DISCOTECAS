import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { loadConfig } from './config.js'

export const config = loadConfig()
export const app = createApp({ config })

export const start = (): void => {
  const server = app.listen(config.port, () => {
    process.stdout.write(`door-service listening on ${config.port}\n`)
  })
  const shutdown = (): void => {
    server.close(() => process.exit(0))
  }
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  start()
}
