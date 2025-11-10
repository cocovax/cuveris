import { create } from 'zustand'
import { type EventLogEntry } from '../types'
import { fetchEventLog } from '../services/api'

interface EventFilter {
  category?: EventLogEntry['category'] | 'all'
  tankId?: string | 'all'
  source?: EventLogEntry['source'] | 'all'
}

interface EventState {
  events: EventLogEntry[]
  loading: boolean
  filters: EventFilter
  load: (force?: boolean) => Promise<void>
  append: (event: EventLogEntry) => void
  setFilters: (filters: EventFilter) => void
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  loading: false,
  filters: {
    category: 'all',
    tankId: 'all',
    source: 'all',
  },
  load: async (force = false) => {
    if (get().loading && !force) return
    set({ loading: true })
    try {
      const events = await fetchEventLog()
      set({ events, loading: false })
    } catch (error) {
      console.error('[EventStore] Impossible de charger l’historique', error)
      set({ loading: false })
    }
  },
  append: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 200),
    })),
  setFilters: (filters) => set({ filters }),
}))

