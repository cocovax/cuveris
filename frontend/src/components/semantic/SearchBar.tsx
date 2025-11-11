import { type ChangeEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTankStore } from '../../store/tankStore'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const tanks = useTankStore((state) => state.tanks)

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []

    return tanks.filter((tank) => {
      const haystack = [tank.name, tank.contents?.grape, tank.contents?.vintage?.toString()]
        .filter(Boolean)
        .join(' ')
      return haystack.toLowerCase().includes(normalized)
    })
  }, [query, tanks])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  return (
    <div className="relative w-full sm:w-72">
      <input
        value={query}
        onChange={handleChange}
        placeholder="Rechercher une cuve..."
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <ul className="max-h-64 overflow-y-auto text-sm">
            {results.map((tank) => (
              <li key={tank.ix}>
                <Link
                  to={`/cuves/${tank.ix}`}
                  className="block px-3 py-2 hover:bg-slate-50"
                  onClick={() => setQuery('')}
                >
                  <p className="font-medium text-slate-900">{tank.name}</p>
                  {tank.contents ? (
                    <p className="text-xs text-slate-500">
                      {tank.contents.grape} · {tank.contents.vintage}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Non renseigné</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

