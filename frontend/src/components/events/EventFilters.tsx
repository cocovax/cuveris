import { useMemo } from 'react'
import { useEventStore } from '../../store/eventStore'
import { useTankStore } from '../../store/tankStore'

const categories = [
  { value: 'all', label: 'Toutes' },
  { value: 'command', label: 'Commandes' },
  { value: 'telemetry', label: 'Télémetrie' },
  { value: 'alarm', label: 'Alarmes' },
] as const

const sources = [
  { value: 'all', label: 'Toutes' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'system', label: 'Système' },
  { value: 'backend', label: 'Backend' },
] as const

export function EventFilters() {
  const filters = useEventStore((state) => state.filters)
  const setFilters = useEventStore((state) => state.setFilters)
  const tanks = useTankStore((state) => state.tanks)

  const tankOptions = useMemo(
    () => [
      { value: 'all', label: 'Toutes les cuves' },
      ...tanks.map((tank) => ({ value: String(tank.ix), label: tank.name })),
    ],
    [tanks],
  )

  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
      <FilterSelect
        label="Catégorie"
        value={filters.category ?? 'all'}
        onChange={(value) => setFilters({ ...filters, category: value as typeof filters.category })}
        options={categories}
      />
      <FilterSelect
        label="Cuve"
        value={filters.tankIx === 'all' ? 'all' : String(filters.tankIx ?? 'all')}
        onChange={(value) => {
          const numeric = Number(value)
          const tankIx = value === 'all' || !Number.isFinite(numeric) ? 'all' : numeric
          setFilters({
            ...filters,
            tankIx,
          })
        }}
        options={tankOptions}
      />
      <FilterSelect
        label="Source"
        value={filters.source ?? 'all'}
        onChange={(value) => setFilters({ ...filters, source: value as typeof filters.source })}
        options={sources}
      />
    </div>
  )
}

interface FilterSelectProps {
  label: string
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
  onChange: (value: string) => void
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

