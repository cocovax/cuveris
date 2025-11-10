import { getDataContext } from '../data/dataContext'
import { type EventLogEntry } from '../domain/eventLog'
import { eventBus } from '../services/eventBus'

const ctx = () => getDataContext()

export const eventRepository = {
  list: (limit = 100) => ctx().events.list(limit),
  append: (event: EventLogEntry) => {
    ctx().events.append(event)
    eventBus.emit(event)
  },
}

