import { Router } from 'express'
import { z } from 'zod'
import { eventRepository } from '../repositories/eventRepository'

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .pipe(z.number().int().positive().max(500).optional()),
})

export const eventRoutes = Router()

eventRoutes.get('/', (req, res) => {
  const parsed = querySchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Paramètres invalides', details: parsed.error.flatten().fieldErrors })
  }
  const limit = parsed.data.limit ?? 100
  const events = eventRepository.list(limit)
  res.json({ data: events })
})

