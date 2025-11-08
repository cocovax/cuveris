import { useEffect, useState } from 'react'
import { type Tank } from '../../types'
import { useTankStore } from '../../store/tankStore'
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

  useEffect(() => {
    setSetpoint(tank.setpoint)
    setGrape(tank.contents?.grape ?? '')
    setVintage(tank.contents?.vintage?.toString() ?? '')
    setVolume(tank.contents?.volumeLiters?.toString() ?? '')
    setNotes(tank.contents?.notes ?? '')
  }, [tank])

  const handleSetpoint = async () => {
    await updateSetpoint(tank.id, Number(setpoint))
    mqttGateway.publishCommand(tank.id, { type: 'setpoint', value: Number(setpoint) })
  }

  const handleToggle = async () => {
    await toggleRunning(tank.id, !tank.isRunning)
    mqttGateway.publishCommand(tank.id, { type: 'running', value: !tank.isRunning })
  }

  const handleContents = async () => {
    const payload = {
      grape,
      vintage: Number(vintage) || new Date().getFullYear(),
      volumeLiters: Number(volume) || tank.capacityLiters,
      notes,
    }
    await updateContents(tank.id, {
      ...payload,
    })
    mqttGateway.publishCommand(tank.id, { type: 'contents', value: payload })
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
      <div className="space-y-3">
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

