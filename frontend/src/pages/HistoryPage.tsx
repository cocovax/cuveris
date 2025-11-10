import { useEffect } from 'react'
import { EventFilters } from '../components/events/EventFilters'
import { EventTable } from '../components/events/EventTable'
import { useEventStore } from '../store/eventStore'

export function HistoryPage() {
  const load = useEventStore((state) => state.load)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Historique</h2>
        <p className="text-sm text-slate-500">
          Retrouvez l’historique des commandes, événements télémétriques et alarmes pour audit et analyse.
        </p>
      </div>
      <EventFilters />
      <EventTable />
    </div>
  )
}

