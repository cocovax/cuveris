import { useEffect, useMemo, useState } from 'react'
import { type Tank } from '../../types'
import { useTankStore } from '../../store/tankStore'
import { useConfigStore } from '../../store/configStore'
import { mqttGateway } from '../../services/mqttGateway'

interface TankControlsProps {
  tank: Tank
}

export function TankControls({ tank }: TankControlsProps) {
  const [setpoint, setSetpoint] = useState(tank.setpoint)
  const [grape, setGrape] = useState(tank.contents?.grape ?? '')
  const [vintage, setVintage] = useState(tank.contents?.vintage?.toString() ?? '')
  const [volume, setVolume] = useState(tank.contents?.volumeLiters?.toString() ?? '')
  const [notes, setNotes] = useState(tank.contents?.notes ?? '')
  const updateSetpoint = useTankStore((state) => state.setSetpoint)
  const toggleRunning = useTankStore((state) => state.toggleRunning)
  const updateContents = useTankStore((state) => state.updateContents)
  const cuveries = useConfigStore((state) => state.cuveries)
  const tankMetadata = useMemo(() => {
    return cuveries
      .flatMap((cuverie) =>
        cuverie.tanks.map((config) => ({
          cuverieName: cuverie.name,
          ix: config.ix,
          id: config.id,
        })),
      )
      .find((item) => item.ix === tank.ix)
  }, [cuveries, tank.ix])
  const tankConfig = useConfigStore((state) =>
    state.cuveries
      .flatMap((cuverie) => cuverie.tanks.map((config) => ({ ...config, cuverieId: cuverie.id })))
      .find((config) => config.ix === tank.ix),
  )

  useEffect(() => {
    setSetpoint(tank.setpoint)
    setGrape(tank.contents?.grape ?? '')
    setVintage(tank.contents?.vintage?.toString() ?? '')
    setVolume(tank.contents?.volumeLiters?.toString() ?? '')
    setNotes(tank.contents?.notes ?? '')
  }, [tank])

  const handleSetpoint = async () => {
    await updateSetpoint(tank.ix, Number(setpoint))
    mqttGateway.publishCommand(tank.ix, { type: 'setpoint', value: Number(setpoint) })
  }

  const handleToggle = async () => {
    await toggleRunning(tank.ix, !tank.isRunning)
    mqttGateway.publishCommand(tank.ix, { type: 'running', value: !tank.isRunning })
  }

  const handleContents = async () => {
    const payload = {
      grape,
      vintage: Number(vintage) || new Date().getFullYear(),
      volumeLiters: Number(volume) || tank.capacityLiters,
      notes,
    }
    // Sauvegarder toutes les infos en BDD via l'API REST
    await updateContents(tank.ix, {
      ...payload,
    })
    // Publier uniquement l'affectation (grape) via MQTT
    mqttGateway.publishCommand(tank.ix, { type: 'contents', value: grape })
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
      <div className="space-y-3">
        {tankConfig && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <p>
              Index MQTT&nbsp;:{' '}
              <code className="font-mono text-slate-600">cuve/{tankConfig.ix}</code>
            </p>
          </div>
        )}
        <label className="block text-sm font-semibold text-slate-700">
          Nouvelle consigne
          <input
            type="number"
            step="0.1"
            value={setpoint}
            onChange={(event) => setSetpoint(Number(event.target.value))}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          onClick={handleSetpoint}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
        >
          Appliquer la consigne
        </button>
        <button
          onClick={handleToggle}
          className={`w-full rounded-md px-3 py-2 text-sm font-semibold text-white shadow transition ${
            tank.isRunning ? 'bg-danger hover:bg-danger/90' : 'bg-success hover:bg-success/90'
          }`}
        >
          {tank.isRunning ? 'Arrêter la cuve' : 'Démarrer la cuve'}
        </button>
      </div>
      <div className="space-y-3">
        {tankMetadata && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <p>
              Cuverie&nbsp;: <span className="font-semibold text-slate-700">{tankMetadata.cuverieName}</span>
            </p>
            <p>
              Index MQTT&nbsp;:{' '}
              <code className="font-mono text-slate-600">cuve/{tankMetadata.ix}</code>
            </p>
          </div>
        )}
        <label className="block text-sm font-semibold text-slate-700">
          Cépage
          <input
            value={grape}
            onChange={(event) => setGrape(event.target.value)}
            placeholder="Ex: Chardonnay"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-semibold text-slate-700">
            Millésime
            <input
              type="number"
              value={vintage}
              onChange={(event) => setVintage(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Volume (L)
            <input
              type="number"
              value={volume}
              onChange={(event) => setVolume(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-700">
          Notes / Observations
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ajouter une note sur la cuve"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={3}
          />
        </label>
        <button
          onClick={handleContents}
          className="w-full rounded-md border border-primary/30 bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm hover:border-primary hover:bg-primary/10"
        >
          Enregistrer le contenu
        </button>
      </div>
    </div>
  )
}

