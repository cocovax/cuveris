import { inMemoryStore } from './inMemoryStore'
import { type Alarm } from '../domain/models'

export const alarmRepository = {
  list: () => inMemoryStore.alarms,
  add: (alarm: Alarm) => {
    inMemoryStore.alarms.unshift(alarm)
    return alarm
  },
  acknowledge: (id: string) => {
    const alarm = inMemoryStore.alarms.find((item) => item.id === id)
    if (!alarm) return undefined
    alarm.acknowledged = true
    return alarm
  },
}

