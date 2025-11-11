import { useMemo } from 'react'
import { useTankStore } from '../store/tankStore'
import { useConfigStore } from '../store/configStore'
import { TankCard } from '../components/tank/TankCard'
import { Skeleton } from '../components/ui/Skeleton'
import { type Tank } from '../types'

export function DashboardPage() {
  const { tanks, loading } = useTankStore()
  const cuveries = useConfigStore((state) => state.cuveries)

  const kpis = useMemo(() => {
    if (tanks.length === 0) {
      return {
        averageTemperature: 0,
        runningCount: 0,
        alarmCount: 0,
      }
    }

    const averageTemperature =
      tanks.reduce((total, tank) => total + tank.temperature, 0) / (tanks.length || 1)
    const runningCount = tanks.filter((tank) => tank.isRunning).length
    const alarmCount = tanks.filter((tank) => tank.alarms.length > 0).length

    return {
      averageTemperature: Number(averageTemperature.toFixed(1)),
      runningCount,
      alarmCount,
    }
  }, [tanks])

  const tanksByCuverie = useMemo(() => {
    const grouped = new Map<string, Tank[]>()
    tanks.forEach((tank) => {
      const key = tank.cuverieId ?? 'default'
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(tank)
    })
    return grouped
  }, [tanks])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-2xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Température moyenne" value={`${kpis.averageTemperature}°C`} />
        <MetricCard title="Cuves actives" value={`${kpis.runningCount}`} />
        <MetricCard title="Alarmes actives" value={`${kpis.alarmCount}`} tone={kpis.alarmCount > 0 ? 'danger' : 'info'} />
        <MetricCard title="Cuves suivies" value={`${tanks.length}`} tone="info" />
      </section>

      {cuveries.length > 0 ? (
        cuveries.map((cuverie) => {
          const cuverieTanks = tanksByCuverie.get(cuverie.id) ?? []
          return (
            <section key={cuverie.id} className="space-y-4">
              <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{cuverie.name}</h2>
                  <p className="text-sm text-slate-500">
                    Mode général :{' '}
                    <span className="font-semibold text-slate-700">
                      {cuverie.mode[0] + cuverie.mode.slice(1).toLowerCase()}
                    </span>
                  </p>
                </div>
              </header>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cuverieTanks.map((tank) => (
                  <TankCard key={tank.ix} tank={tank} />
                ))}
                {cuverieTanks.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
                    Aucune cuve associée à cette cuverie.
                  </div>
                )}
              </div>
            </section>
          )
        })
      ) : (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Cuves</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tanks.map((tank) => (
              <TankCard key={tank.ix} tank={tank} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  tone?: 'info' | 'danger'
}

function MetricCard({ title, value, tone = 'info' }: MetricCardProps) {
  const toneClasses =
    tone === 'danger'
      ? 'bg-danger/10 text-danger'
      : 'bg-primary/10 text-primary'

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm`}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses}`}>
        Mise à jour continue
      </span>
    </div>
  )
}

