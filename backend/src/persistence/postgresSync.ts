import { postgresAdapters } from '../data/dataContext'
import { eventBus } from '../services/eventBus'
import { type EventLogEntry } from '../domain/eventLog'

export const initPostgresSync = () => {
  if (!postgresAdapters) {
    return () => undefined
  }

  const unsubscribeEvents = eventBus.subscribe(async (event: EventLogEntry) => {
    try {
      await postgresAdapters?.events.append(event)
    } catch (error) {
      console.error('[PostgresSync] Impossible de persister l’événement', error)
    }
  })

  return () => {
    unsubscribeEvents()
  }
}

