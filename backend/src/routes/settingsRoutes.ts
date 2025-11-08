import { Router } from 'express'
import { z } from 'zod'
import { settingsRepository } from '../repositories/settingsRepository'
import { type Settings } from '../domain/models'

const settingsSchema = z.object({
  alarmThresholds: z
    .object({
      high: z.number().min(-10).max(80),
      low: z.number().min(-10).max(80),
    })
    .partial()
    .optional(),
  preferences: z
    .object({
      locale: z.string(),
      temperatureUnit: z.enum(['C', 'F']),
      theme: z.enum(['light', 'dark', 'auto']),
    })
    .partial()
    .optional(),
})

export const settingsRoutes = Router()

settingsRoutes.get('/', (_req, res) => {
  res.json({ data: settingsRepository.get() })
})

settingsRoutes.patch('/', (req, res) => {
  const parsed = settingsSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors })
  }
  const current = settingsRepository.get()
  const payload: Partial<Settings> = {}
  if (parsed.data.alarmThresholds) {
    const thresholds = { ...current.alarmThresholds }
    if (parsed.data.alarmThresholds.high !== undefined) {
      thresholds.high = parsed.data.alarmThresholds.high
    }
    if (parsed.data.alarmThresholds.low !== undefined) {
      thresholds.low = parsed.data.alarmThresholds.low
    }
    payload.alarmThresholds = thresholds
  }
  if (parsed.data.preferences) {
    const preferences = { ...current.preferences }
    if (parsed.data.preferences.locale !== undefined) {
      preferences.locale = parsed.data.preferences.locale
    }
    if (parsed.data.preferences.temperatureUnit !== undefined) {
      preferences.temperatureUnit = parsed.data.preferences.temperatureUnit
    }
    if (parsed.data.preferences.theme !== undefined) {
      preferences.theme = parsed.data.preferences.theme
    }
    payload.preferences = preferences
  }
  const updated = settingsRepository.update(payload)
  res.json({ data: updated })
})

