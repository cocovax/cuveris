import { inMemoryStore } from './inMemoryStore'
import { type Settings } from '../domain/models'

export const settingsRepository = {
  get: () => inMemoryStore.settings,
  update: (payload: Partial<Settings>) => {
    inMemoryStore.settings = {
      ...inMemoryStore.settings,
      ...payload,
      alarmThresholds: {
        ...inMemoryStore.settings.alarmThresholds,
        ...(payload.alarmThresholds ?? {}),
      },
      preferences: {
        ...inMemoryStore.settings.preferences,
        ...(payload.preferences ?? {}),
      },
    }
    return inMemoryStore.settings
  },
}

