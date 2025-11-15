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

const parseIx = (value: string) => {
  const ix = Number(value)
  return Number.isFinite(ix) ? ix : undefined
}

tankRoutes.get('/:ix', (req, res) => {
  const ix = parseIx(req.params.ix)
  if (ix === undefined) {
    return res.status(400).json({ error: 'Identifiant de cuve invalide' })
  }
  const tank = tankRepository.getByIx(ix)
  if (!tank) {
    return res.status(404).json({ error: 'Cuve introuvable' })
  }
  return res.json({ data: tank })
})

tankRoutes.post('/:ix/setpoint', (req, res) => {
  const ix = parseIx(req.params.ix)
  if (ix === undefined) {
    return res.status(400).json({ error: 'Identifiant de cuve invalide' })
  }
  const parsed = setpointSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  const updated = tankRepository.updateSetpoint(ix, parsed.data.value)
  if (!updated) return res.status(404).json({ error: 'Cuve introuvable' })
  mqttGateway.publishCommand(ix, { type: 'setpoint', value: parsed.data.value })
  return res.json({ data: updated })
})

tankRoutes.post('/:ix/running', (req, res) => {
  const ix = parseIx(req.params.ix)
  if (ix === undefined) {
    return res.status(400).json({ error: 'Identifiant de cuve invalide' })
  }
  const parsed = runningSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  const updated = tankRepository.updateRunning(ix, parsed.data.value)
  if (!updated) return res.status(404).json({ error: 'Cuve introuvable' })
  mqttGateway.publishCommand(ix, { type: 'running', value: parsed.data.value })
  return res.json({ data: updated })
})

tankRoutes.post('/:ix/contents', (req, res) => {
  const ix = parseIx(req.params.ix)
  if (ix === undefined) {
    return res.status(400).json({ error: 'Identifiant de cuve invalide' })
  }
  const parsed = contentsSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  const { notes, ...rest } = parsed.data
  const contents: TankContents =
    notes === undefined ? { ...rest } : { ...rest, notes }
  const updated = tankRepository.updateContents(ix, contents)
  if (!updated) return res.status(404).json({ error: 'Cuve introuvable' })
  // Publier uniquement l'affectation (grape) via MQTT, les autres infos restent en BDD
  mqttGateway.publishCommand(ix, { type: 'contents', value: contents.grape })
  return res.json({ data: updated })
})

