import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useConfigStore } from '../store/configStore'
import { useTankStore } from '../store/tankStore'
import { TankCard } from '../components/tank/TankCard'
import { GeneralModeControl } from '../components/cuverie/GeneralModeControl'
import { Skeleton } from '../components/ui/Skeleton'

export function CuveriePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { cuveries, loading, load } = useConfigStore()
  const tanks = useTankStore((state) => state.tanks)

  useEffect(() => {
    void load()
  }, [load])

  const cuverie = useMemo(() => cuveries.find((item) => item.id === id), [cuveries, id])

  useEffect(() => {
    if (!loading && cuveries.length > 0 && !cuverie) {
      navigate('/')
    }
  }, [cuverie, cuveries.length, loading, navigate])

  if (loading && !cuverie) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!cuverie) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        Aucune cuverie sélectionnée.
      </div>
    )
  }

  const tanksInCuverie = cuverie.tanks
    .map((config) => tanks.find((tank) => tank.ix === config.ix))
    .filter((tank): tank is NonNullable<typeof tank> => Boolean(tank))

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-slate-900">{cuverie.name}</h2>
        <p className="text-sm text-slate-500">
          Gestion des cuves et du mode général de la cuverie. Configuration issue du topic MQTT{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-600">global/config/cuves</code>.
        </p>
      </header>
      <GeneralModeControl cuverieId={cuverie.id} currentMode={cuverie.mode} />
      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Cuves ({tanksInCuverie.length})</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tanksInCuverie.map((tank) => (
            <TankCard key={`${tank.ix}-${tank.temperature}-${tank.setpoint}-${tank.lastUpdatedAt}`} tank={tank} />
          ))}
        </div>
      </section>
    </div>
  )
}

