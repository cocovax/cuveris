import { useMemo } from 'react'
import { useEventStore } from '../../store/eventStore'
import { type EventLogEntry } from '../../types'

const categoryBadge: Record<EventLogEntry['category'], string> = {
  command: 'bg-primary/10 text-primary',
  telemetry: 'bg-sky-100 text-sky-700',
  alarm: 'bg-danger/10 text-danger',
}

const sourceLabel: Record<EventLogEntry['source'], string> = {
  user: 'Utilisateur',
  system: 'Système',
  backend: 'Backend',
}

export function EventTable() {
  const { events, loading, filters } = useEventStore()

  const filtered = useMemo(() => {
    return events.filter((event) => {
      if (filters.category && filters.category !== 'all' && event.category !== filters.category) return false
      if (filters.tankId && filters.tankId !== 'all' && event.tankId !== filters.tankId) return false
      if (filters.source && filters.source !== 'all' && event.source !== filters.source) return false
      return true
    })
  }, [events, filters])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        Chargement de l’historique…
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        Aucun événement correspondant à vos filtres.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left">
            <th className="px-4 py-3 font-semibold text-slate-500">Horodatage</th>
            <th className="px-4 py-3 font-semibold text-slate-500">Catégorie</th>
            <th className="px-4 py-3 font-semibold text-slate-500">Source</th>
            <th className="px-4 py-3 font-semibold text-slate-500">Cuve</th>
            <th className="px-4 py-3 font-semibold text-slate-500">Résumé</th>
            <th className="px-4 py-3 font-semibold text-slate-500">Détails</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {filtered.map((event) => (
            <tr key={event.id}>
              <td className="px-4 py-3 text-slate-500">
                {new Date(event.timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryBadge[event.category]}`}>
                  {event.category}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-600">{sourceLabel[event.source]}</td>
              <td className="px-4 py-3 text-slate-600">{event.tankId ?? '—'}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{event.summary}</td>
              <td className="px-4 py-3 text-slate-500">{event.details ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

