import express from 'express'
import cors from 'cors'
import { tankRoutes } from './routes/tankRoutes'
import { alarmRoutes } from './routes/alarmRoutes'
import { settingsRoutes } from './routes/settingsRoutes'
import { mqttRoutes } from './routes/mqttRoutes'
import { env } from './config/env'
import { mqttGateway } from './services/mqttGateway'

export const createApp = () => {
  const app = express()
  app.use(
    cors({
      origin: env.nodeEnv === 'development' ? '*' : undefined,
    }),
  )
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode: env.nodeEnv, mqttMode: mqttGateway.getMode() })
  })

  app.use('/api/tanks', tankRoutes)
  app.use('/api/alarms', alarmRoutes)
  app.use('/api/settings', settingsRoutes)
  app.use('/api/mqtt', mqttRoutes)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route introuvable' })
  })

  return app
}

