import { Link } from 'react-router-dom'
import { useTankStore } from '../../store/tankStore'
import { SearchBar } from '../semantic/SearchBar'

export function Header() {
  const alarms = useTankStore((state) => state.alarms)

  return (
    <header className="sticky top-0 z-10 flex flex-col gap-4 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Supervision Cuverie</h1>
        <p className="text-sm text-slate-500">
          {alarms.length > 0
            ? `${alarms.length} alarme${alarms.length > 1 ? 's' : ''} en cours`
            : 'Aucune alarme active'}
        </p>
      </div>
      <div className="flex w-full flex-col items-end gap-3 sm:w-auto sm:flex-row sm:items-center">
        <SearchBar />
        <Link
          to="/alarmes"
          className="inline-flex items-center rounded-md bg-danger px-3 py-2 text-sm font-semibold text-white shadow hover:bg-danger/90"
        >
          Voir les alarmes
        </Link>
      </div>
    </header>
  )
}

