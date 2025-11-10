import { type Settings } from '../domain/models'
import { getDataContext } from '../data/dataContext'

export const settingsRepository = {
  get: () => getDataContext().settings.get(),
  update: (payload: Partial<Settings>) => getDataContext().settings.update(payload),
}

