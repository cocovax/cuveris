import http from 'node:http'
import { Server } from 'socket.io'
import { createApp } from './app'
import { env } from './config/env'
import { tankRepository } from './repositories/tankRepository'
import { mqttGateway } from './services/mqttGateway'

const app = createApp()
const httpServer = http.createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: env.nodeEnv === 'development' ? '*' : undefined,
  },
})

io.on('connection', (socket) => {
  socket.emit('tanks:init', tankRepository.list())
})

const unsubscribe = mqttGateway.onTelemetry(({ tank }) => {
  io.emit('tanks:update', tank)
})

mqttGateway.start()

const port = env.port

httpServer.listen(port, () => {
  console.log(`🚀 Backend Cuverie lancé sur http://localhost:${port} (${env.nodeEnv})`)
})

const shutdown = (signal: string) => {
  console.log(`\n${signal} reçu, arrêt du serveur...`)
  unsubscribe()
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

