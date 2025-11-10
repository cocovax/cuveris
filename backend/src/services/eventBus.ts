import { EventEmitter } from 'node:events'
import { type EventLogEntry } from '../domain/eventLog'

const bus = new EventEmitter()

export const eventBus = {
  emit: (event: EventLogEntry) => {
    bus.emit('event', event)
  },
  subscribe: (listener: (event: EventLogEntry) => void) => {
    bus.on('event', listener)
    return () => bus.off('event', listener)
  },
}

