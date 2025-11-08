import { Router } from 'express'
import { z } from 'zod'
import { mqttGateway, type MqttGatewayMode } from '../services/mqttGateway'

const modeSchema = z.object({
  mode: z.enum(['mock', 'live']),
})

export const mqttRoutes = Router()

mqttRoutes.get('/', (_req, res) => {
  res.json({ data: { mode: mqttGateway.getMode() } })
})

mqttRoutes.post('/mode', (req, res) => {
  const parsed = modeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  mqttGateway.switchMode(parsed.data.mode as MqttGatewayMode)
  res.json({ data: { mode: mqttGateway.getMode() } })
})

