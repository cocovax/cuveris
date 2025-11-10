import { type Alarm } from '../domain/models'
import { getDataContext } from '../data/dataContext'

export const alarmRepository = {
  list: () => getDataContext().alarms.list(),
  add: (alarm: Alarm) => getDataContext().alarms.add(alarm),
  acknowledge: (id: string) => getDataContext().alarms.update(id, (alarm) => ({ ...alarm, acknowledged: true })),
}

