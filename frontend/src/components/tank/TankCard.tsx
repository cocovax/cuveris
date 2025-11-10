import { Link } from 'react-router-dom'
import { type Tank } from '../../types'
import { useConfigStore } from '../../store/configStore'
import { TankStatusPill } from './TankStatusPill'

interface TankCardProps {
  tank: Tank
}

export function TankCard({ tank }: TankCardProps) {
  const cuverieName =
    useConfigStore((state) => state.cuveries.find((cuverie) => cuverie.id === tank.cuverieId)?.name) ?? null
  const trend = Number((tank.temperature - tank.setpoint).toFixed(1))
  const trendLabel = trend === 0 ? 'Stable' : trend > 0 ? `+${trend}°C` : `${trend}°C`

  return (
    <Link
      to={`/cuves/${tank.id}`}
      className="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {cuverieName ? cuverieName : 'Cuve'}
          </p>
          <h2 className="text-xl font-semibold text-slate-900">{tank.name}</h2>
        </div>
        <TankStatusPill status={tank.status} />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-4xl font-semibold text-slate-900">{tank.temperature.toFixed(1)}°C</p>
          <p className="text-sm text-slate-500">
            Consigne <span className="font-semibold text-primary">{tank.setpoint.toFixed(1)}°C</span>
          </p>
        </div>
        <div className="text-right text-sm">
          <p className={`font-semibold ${trend >= 1 ? 'text-danger' : trend <= -1 ? 'text-success' : 'text-slate-500'}`}>
            {trendLabel}
          </p>
          <p className="text-xs text-slate-400">vs consigne</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, tank.fillLevelPercent))}%` }}
            aria-hidden
          />
        </div>
        <span className="text-xs font-semibold text-slate-600">{tank.fillLevelPercent}%</span>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <p>
          Capacité {tank.capacityLiters.toLocaleString('fr-FR')} L ·{' '}
          {tank.contents ? `${tank.contents.grape} ${tank.contents.vintage}` : 'Non renseigné'}
        </p>
        <p>Maj {new Date(tank.lastUpdatedAt).toLocaleTimeString('fr-FR')}</p>
      </div>

      {tank.alarms.length > 0 && (
        <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs font-semibold text-danger">
          {tank.alarms[0]}
        </div>
      )}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-2 rounded-b-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-0 transition group-hover:opacity-100" />
    </Link>
  )
}

