import http from 'node:http'
import { Server } from 'socket.io'
import { createApp } from './app'
import { env } from './config/env'
import { tankRepository } from './repositories/tankRepository'
import { mqttGateway } from './services/mqttGateway'
import { authService } from './services/authService'
import { initPostgresSync } from './persistence/postgresSync'
import { eventBus } from './services/eventBus'

const app = createApp()
const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: env.nodeEnv === 'development' ? '*' : undefined,
  },
})

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined
  if (!token) {
    return next(new Error('Unauthorized'))
  }
  const payload = authService.verifyToken(token)
  if (!payload) {
    return next(new Error('Unauthorized'))
  }
  socket.data.user = payload
  return next()
})

io.on('connection', (socket) => {
  socket.emit('tanks:init', tankRepository.list())
  const unsubscribeEvents = eventBus.subscribe((event) => {
    socket.emit('events:new', event)
  })
  socket.on('disconnect', () => {
    unsubscribeEvents()
  })
})

const disposePostgresSync = initPostgresSync()

const unsubscribe = mqttGateway.onTelemetry(({ tank }) => {
  io.emit('tanks:update', tank)
})
const unsubscribeConfig = mqttGateway.onConfig((event) => {
  io.emit('config:update', event)
})

mqttGateway.start()

const port = env.port

httpServer.listen(port, () => {
  console.log(`🚀 Backend Cuverie lancé sur http://localhost:${port} (${env.nodeEnv})`)
})

const shutdown = (signal: string) => {
  console.log(`\n${signal} reçu, arrêt du serveur...`)
  unsubscribe()
  unsubscribeConfig()
  disposePostgresSync()
  mqttGateway.stop()
  io.close()
  httpServer.close(() => {
    console.log('Serveur arrêté proprement.')
    process.exit(0)
  })
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal))
})

