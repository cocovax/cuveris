import express from 'express'
import cors from 'cors'
import { tankRoutes } from './routes/tankRoutes'
import { alarmRoutes } from './routes/alarmRoutes'
import { settingsRoutes } from './routes/settingsRoutes'
import { mqttRoutes } from './routes/mqttRoutes'
import { authRoutes } from './routes/authRoutes'
import { eventRoutes } from './routes/eventRoutes'
import { configRoutes } from './routes/configRoutes'
import { cuverieRoutes } from './routes/cuverieRoutes'
import { authenticate } from './middleware/authMiddleware'
import { env } from './config/env'
import { mqttGateway } from './services/mqttGateway'

export const createApp = () => {
  const app = express()
  const allowedOrigins =
    env.corsOrigin?.split(',').map((origin) => origin.trim()).filter(Boolean) ??
    (env.nodeEnv === 'development' ? ['*'] : ['http://localhost:5173'])

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`))
        }
      },
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mode: env.nodeEnv, mqttMode: mqttGateway.getMode() })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/tanks', authenticate, tankRoutes)
  app.use('/api/alarms', authenticate, alarmRoutes)
  app.use('/api/settings', authenticate, settingsRoutes)
  app.use('/api/mqtt', authenticate, mqttRoutes)
  app.use('/api/events', authenticate, eventRoutes)
  app.use('/api/config', authenticate, configRoutes)
  app.use('/api/cuveries', authenticate, cuverieRoutes)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route introuvable' })
  })

  return app
}

