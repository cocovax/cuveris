import { type FormEvent, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useMqttStore } from '../store/mqttStore'
import { mqttGateway } from '../services/mqttGateway'
import { type MqttGatewayMode } from '../config/mqtt'

export function SettingsPage() {
  const { alarmThresholds, preferences, updateThresholds, updateTemperatureUnit, updateTheme } = useSettingsStore()
  const [high, setHigh] = useState(alarmThresholds.high)
  const [low, setLow] = useState(alarmThresholds.low)
  const mode = useMqttStore((state) => state.mode)
  const status = useMqttStore((state) => state.status)
  const error = useMqttStore((state) => state.error)

  const handleModeChange = (nextMode: MqttGatewayMode) => {
    if (nextMode === mode) return
    mqttGateway.switchMode(nextMode)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    updateThresholds({ high: Number(high), low: Number(low) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Réglages</h2>
        <p className="text-sm text-slate-500">
          Configurez les seuils d&apos;alarme, les unités d&apos;affichage et les préférences de l&apos;interface.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header>
            <h3 className="text-lg font-semibold text-slate-900">Seuils d&apos;alarme</h3>
            <p className="text-sm text-slate-500">
              Définissez les seuils haut et bas de température déclenchant une alarme.
            </p>
          </header>
          <label className="block text-sm font-semibold text-slate-700">
            Seuil haut ({preferences.temperatureUnit})
            <input
              type="number"
              step="0.1"
              value={high}
              onChange={(event) => setHigh(Number(event.target.value))}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Seuil bas ({preferences.temperatureUnit})
            <input
              type="number"
              step="0.1"
              value={low}
              onChange={(event) => setLow(Number(event.target.value))}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90"
          >
            Sauvegarder les seuils
          </button>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header>
            <h3 className="text-lg font-semibold text-slate-900">Préférences utilisateur</h3>
            <p className="text-sm text-slate-500">Personnalisez l&apos;application selon vos besoins.</p>
          </header>

          <div>
            <p className="text-sm font-semibold text-slate-700">Unité de température</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['C', 'F'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => updateTemperatureUnit(unit)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    preferences.temperatureUnit === unit
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                  }`}
                >
                  °{unit}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">Thème</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'light', label: 'Clair' },
                  { value: 'dark', label: 'Sombre' },
                  { value: 'auto', label: 'Auto' },
                ] as const
              ).map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => updateTheme(option.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    preferences.theme === option.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-700">Notifications push</p>
            <p>
              Les notifications seront activées automatiquement lorsque vous installerez l&apos;application sur votre
              appareil (PWA).
            </p>
          </div>
        </section>
      </form>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header>
          <h3 className="text-lg font-semibold text-slate-900">Mode MQTT</h3>
          <p className="text-sm text-slate-500">
            Choisissez entre le mode démonstration (simulateur) et la connexion au broker de production.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['mock', 'live'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleModeChange(option)}
              className={`rounded-lg border px-4 py-3 text-left transition ${
                mode === option
                  ? 'border-primary bg-primary text-white shadow'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              <p className="text-sm font-semibold">
                {option === 'mock' ? 'Mode démonstration' : 'Mode production'}
              </p>
              <p className={`mt-1 text-xs ${mode === option ? 'text-white/80' : 'text-slate-500'}`}>
                {option === 'mock'
                  ? 'Utilise le simulateur local pour générer la télémétrie.'
                  : 'Se connecte au broker configuré (WSS).'}
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Statut actuel : <span className="font-semibold">{status}</span>
          {error ? <span className="text-danger"> · {error}</span> : null}
        </p>
      </section>
    </div>
  )
}

