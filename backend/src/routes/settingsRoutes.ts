import { Router } from 'express'
import { z } from 'zod'
import { settingsRepository } from '../repositories/settingsRepository'
import { type Settings } from '../domain/models'
import { requireRole } from '../middleware/authMiddleware'

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
  mqtt: z
    .object({
      url: z.string().url().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      reconnectPeriod: z.number().int().positive().optional(),
      enableMock: z.boolean().optional(),
    })
    .partial()
    .optional(),
})

export const settingsRoutes = Router()

settingsRoutes.get('/', requireRole('supervisor'), (_req, res) => {
  res.json({ data: settingsRepository.get() })
})

settingsRoutes.patch('/', requireRole('supervisor'), (req, res) => {
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
  if (parsed.data.mqtt) {
    const mqtt = { ...current.mqtt }
    if (parsed.data.mqtt.url !== undefined) {
      mqtt.url = parsed.data.mqtt.url
    }
    if (parsed.data.mqtt.username !== undefined) {
      mqtt.username = parsed.data.mqtt.username
    }
    if (parsed.data.mqtt.password !== undefined) {
      mqtt.password = parsed.data.mqtt.password
    }
    if (parsed.data.mqtt.reconnectPeriod !== undefined) {
      mqtt.reconnectPeriod = parsed.data.mqtt.reconnectPeriod
    }
    if (parsed.data.mqtt.enableMock !== undefined) {
      mqtt.enableMock = parsed.data.mqtt.enableMock
    }
    payload.mqtt = mqtt
  }
  const updated = settingsRepository.update(payload)
  res.json({ data: updated })
})

