import { type Alarm } from '../domain/models'
import { getDataContext } from '../data/dataContext'
import { eventRepository } from './eventRepository'

export const alarmRepository = {
  list: () => getDataContext().alarms.list(),
  add: (alarm: Alarm) => {
    eventRepository.append({
      id: `alarm-${alarm.id}`,
      timestamp: alarm.triggeredAt,
      tankId: alarm.tankId,
      category: 'alarm',
      source: 'system',
      summary: alarm.message,
      metadata: { severity: alarm.severity },
    })
    return getDataContext().alarms.add(alarm)
  },
  acknowledge: (id: string) =>
    getDataContext().alarms.update(id, (alarm) => {
      eventRepository.append({
        id: `alarm-ack-${id}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tankId: alarm.tankId,
        category: 'alarm',
        source: 'user',
        summary: `Alarme acquittée : ${alarm.message}`,
      })
      return { ...alarm, acknowledged: true }
    }),
}

