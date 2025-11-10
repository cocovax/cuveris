import { getDataContext } from '../data/dataContext'
import { type GeneralMode } from '../domain/config'

const ctx = () => getDataContext()

export const modeRepository = {
  get: (cuverieId: string) => ctx().generalModes.get(cuverieId),
  set: (cuverieId: string, mode: GeneralMode) => ctx().generalModes.set(cuverieId, mode),
}

