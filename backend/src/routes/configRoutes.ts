import { Router } from 'express'
import { configRepository } from '../repositories/configRepository'
import { modeRepository } from '../repositories/modeRepository'

export const configRoutes = Router()

configRoutes.get('/', (_req, res) => {
  const cuveries = configRepository.list().map((cuverie) => ({
    ...cuverie,
    mode: modeRepository.get(cuverie.id) ?? 'ARRET',
  }))
  res.json({ data: cuveries })
})

