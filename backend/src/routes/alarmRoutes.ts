import { Router } from 'express'
import { alarmRepository } from '../repositories/alarmRepository'

export const alarmRoutes = Router()

alarmRoutes.get('/', (_req, res) => {
  res.json({ data: alarmRepository.list() })
})

alarmRoutes.post('/:id/acknowledge', (req, res) => {
  const alarm = alarmRepository.acknowledge(req.params.id)
  if (!alarm) return res.status(404).json({ error: 'Alarme introuvable' })
  return res.json({ data: alarm })
})

