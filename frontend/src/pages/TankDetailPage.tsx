import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTankStore } from '../store/tankStore'
import { TankStatusPill } from '../components/tank/TankStatusPill'
import { TemperatureChart } from '../components/tank/TemperatureChart'
import { TankControls } from '../components/tank/TankControls'
import { Skeleton } from '../components/ui/Skeleton'

export function TankDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tanks, selectTank, selectedTank, selectedTankLoading } = useTankStore()

  useEffect(() => {
    if (!id) return
    selectTank(id).catch(() => navigate('/'))
  }, [id, selectTank, navigate])

  if (selectedTankLoading || !selectedTank) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  const tank = selectedTank ?? tanks.find((item) => item.id === id)
  if (!tank) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        Cuve introuvable
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <span className="text-lg font-semibold">{tank.name.replace(/\D/g, '')}</span>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{tank.name}</h2>
              <p className="text-sm text-slate-500">
                Volume rempli: {tank.fillLevelPercent}% · {tank.capacityLiters.toLocaleString('fr-FR')} L
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TankStatusPill status={tank.status} />
            <span className="text-sm text-slate-500">
              Dernière mise à jour {new Date(tank.lastUpdatedAt).toLocaleTimeString('fr-FR')}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Metric label="Température" value={`${tank.temperature.toFixed(1)}°C`} />
            <Metric label="Consigne" value={`${tank.setpoint.toFixed(1)}°C`} tone="highlight" />
            <Metric
              label="Écart"
              value={`${(tank.temperature - tank.setpoint).toFixed(1)}°C`}
              tone={tank.temperature > tank.setpoint + 1 ? 'warning' : 'muted'}
            />
            <Metric label="Statut" value={tank.isRunning ? 'En marche' : 'Arrêtée'} tone={tank.isRunning ? 'success' : 'muted'} />
          </div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">Contenu</p>
            {tank.contents ? (
              <div className="space-y-1">
                <p>
                  {tank.contents.grape} · Millésime {tank.contents.vintage} ·{' '}
                  {tank.contents.volumeLiters.toLocaleString('fr-FR')} L
                </p>
                {tank.contents.notes && <p className="text-xs text-slate-500">{tank.contents.notes}</p>}
              </div>
            ) : (
              <p>Non renseigné</p>
            )}
          </div>
        </div>

        <TankControls tank={tank} />
      </section>

      <TemperatureChart data={tank.history} setpoint={tank.setpoint} />
    </div>
  )
}

interface MetricProps {
  label: string
  value: string
  tone?: 'highlight' | 'warning' | 'success' | 'muted'
}

type MetricTone = NonNullable<MetricProps['tone']>

function Metric({ label, value, tone = 'muted' }: MetricProps) {
  const toneClass: Record<MetricTone, string> = {
    highlight: 'text-primary',
    warning: 'text-danger',
    success: 'text-success',
    muted: 'text-slate-600',
  }

  const resolvedTone: MetricTone = tone ?? 'muted'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${toneClass[resolvedTone]}`}>{value}</p>
    </div>
  )
}

