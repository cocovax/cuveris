import { Router } from 'express'
import { z } from 'zod'
import { modeRepository } from '../repositories/modeRepository'
import { configRepository } from '../repositories/configRepository'
import { mqttGateway } from '../services/mqttGateway'
import { eventRepository } from '../repositories/eventRepository'

const modeSchema = z.object({
  mode: z.enum(['CHAUD', 'FROID', 'ARRET']),
})

export const cuverieRoutes = Router()

cuverieRoutes.post('/:id/mode', (req, res) => {
  const parsed = modeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  const cuverie = configRepository.list().find((entry) => entry.id === req.params.id)
  if (!cuverie) {
    return res.status(404).json({ error: 'Cuverie introuvable' })
  }
  modeRepository.set(cuverie.id, parsed.data.mode)
  mqttGateway.publishGeneralMode(cuverie.name, parsed.data.mode)
  eventRepository.append({
    id: `mode-${cuverie.id}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    category: 'command',
    source: 'user',
    summary: `Mode général ${parsed.data.mode} appliqué à ${cuverie.name}`,
    metadata: { cuverieId: cuverie.id },
  })
  res.json({ data: { id: cuverie.id, mode: parsed.data.mode } })
})

