import { Router } from 'express'
import { z } from 'zod'
import { tankRepository } from '../repositories/tankRepository'
import { mqttGateway } from '../services/mqttGateway'
import { type TankContents } from '../domain/models'

const setpointSchema = z.object({
  value: z.number().min(-10).max(60),
})

const runningSchema = z.object({
  value: z.boolean(),
})

const contentsSchema = z.object({
  grape: z.string().min(1),
  vintage: z.number().min(1900).max(2100),
  volumeLiters: z.number().positive(),
  notes: z.string().optional(),
})

export const tankRoutes = Router()

tankRoutes.get('/', (_req, res) => {
  res.json({ data: tankRepository.list() })
})

tankRoutes.get('/:id', (req, res) => {
  const tank = tankRepository.getById(req.params.id)
  if (!tank) {
    return res.status(404).json({ error: 'Cuve introuvable' })
  }
  return res.json({ data: tank })
})

tankRoutes.post('/:id/setpoint', (req, res) => {
  const parsed = setpointSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  const updated = tankRepository.updateSetpoint(req.params.id, parsed.data.value)
  if (!updated) return res.status(404).json({ error: 'Cuve introuvable' })
  mqttGateway.publishCommand(req.params.id, { type: 'setpoint', value: parsed.data.value })
  return res.json({ data: updated })
})

tankRoutes.post('/:id/running', (req, res) => {
  const parsed = runningSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  const updated = tankRepository.updateRunning(req.params.id, parsed.data.value)
  if (!updated) return res.status(404).json({ error: 'Cuve introuvable' })
  mqttGateway.publishCommand(req.params.id, { type: 'running', value: parsed.data.value })
  return res.json({ data: updated })
})

tankRoutes.post('/:id/contents', (req, res) => {
  const parsed = contentsSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  const { notes, ...rest } = parsed.data
  const contents: TankContents =
    notes === undefined ? { ...rest } : { ...rest, notes }
  const updated = tankRepository.updateContents(req.params.id, contents)
  if (!updated) return res.status(404).json({ error: 'Cuve introuvable' })
  mqttGateway.publishCommand(req.params.id, { type: 'contents', value: contents })
  return res.json({ data: updated })
})

