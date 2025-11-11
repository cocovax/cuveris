import { type FormEvent, useEffect, useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import { useMqttStore } from '../store/mqttStore'
import { mqttGateway } from '../services/mqttGateway'
import { type MqttGatewayMode } from '../config/mqtt'
import { fetchSettingsState, updateSettingsState } from '../services/api'
import { useAuthStore } from '../store/authStore'

export function SettingsPage() {
  const {
    alarmThresholds,
    preferences,
    mqtt,
    updateThresholds,
    updateTemperatureUnit,
    updateTheme,
    updateMqtt,
    replace,
    setLoading,
    loading,
  } = useSettingsStore()
  const [high, setHigh] = useState(alarmThresholds.high)
  const [low, setLow] = useState(alarmThresholds.low)
  const [mqttUrl, setMqttUrl] = useState(mqtt.url ?? '')
  const [mqttUsername, setMqttUsername] = useState(mqtt.username ?? '')
  const [mqttPassword, setMqttPassword] = useState(mqtt.password ?? '')
  const [mqttReconnect, setMqttReconnect] = useState<number>(mqtt.reconnectPeriod)
  const [mqttEnableMock, setMqttEnableMock] = useState<boolean>(mqtt.enableMock)
  const mode = useMqttStore((state) => state.mode)
  const status = useMqttStore((state) => state.status)
  const error = useMqttStore((state) => state.error)
  const role = useAuthStore((state) => state.user?.role)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const settings = await fetchSettingsState()
        replace(settings)
        setHigh(settings.alarmThresholds.high)
        setLow(settings.alarmThresholds.low)
        setMqttUrl(settings.mqtt.url ?? '')
        setMqttUsername(settings.mqtt.username ?? '')
        setMqttPassword(settings.mqtt.password ?? '')
        setMqttReconnect(settings.mqtt.reconnectPeriod)
        setMqttEnableMock(settings.mqtt.enableMock)
      } catch (error) {
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 403) {
          console.warn('[Settings] Accès aux paramètres restreint')
        } else {
          console.error('[Settings] Impossible de charger les paramètres', error)
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [replace, setLoading])

  useEffect(() => {
    setHigh(alarmThresholds.high)
    setLow(alarmThresholds.low)
  }, [alarmThresholds])

  useEffect(() => {
    setMqttUrl(mqtt.url ?? '')
    setMqttUsername(mqtt.username ?? '')
    setMqttPassword(mqtt.password ?? '')
    setMqttReconnect(mqtt.reconnectPeriod)
    setMqttEnableMock(mqtt.enableMock)
  }, [mqtt])

  const handleModeChange = (nextMode: MqttGatewayMode) => {
    if (nextMode === mode) return
    mqttGateway.switchMode(nextMode)
  }

  const handleThresholdSubmit = async (event: FormEvent) => {
    event.preventDefault()
    updateThresholds({ high: Number(high), low: Number(low) })
    try {
      const updated = await updateSettingsState({
        alarmThresholds: { high: Number(high), low: Number(low) },
      })
      replace(updated)
    } catch (error) {
      console.error('[Settings] Impossible de sauvegarder les seuils', error)
    }
  }

  const handleTemperatureUnit = async (unit: 'C' | 'F') => {
    updateTemperatureUnit(unit)
    try {
      const updated = await updateSettingsState({
        preferences: { temperatureUnit: unit },
      })
      replace(updated)
    } catch (error) {
      console.error('[Settings] Sauvegarde unité échouée', error)
    }
  }

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    updateTheme(theme)
    try {
      const updated = await updateSettingsState({
        preferences: { theme },
      })
      replace(updated)
    } catch (error) {
      console.error('[Settings] Sauvegarde thème échouée', error)
    }
  }

  const handleMqttSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const payload = {
      url: mqttUrl || undefined,
      username: mqttUsername || undefined,
      password: mqttPassword || undefined,
      reconnectPeriod: Number(mqttReconnect) || 2000,
      enableMock: mqttEnableMock,
    }
    updateMqtt(payload)
    try {
      const updated = await updateSettingsState({ mqtt: payload })
      replace(updated)
    } catch (error) {
      console.error('[Settings] Sauvegarde MQTT échouée', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Réglages</h2>
        <p className="text-sm text-slate-500">
          Configurez les seuils d&apos;alarme, les unités d&apos;affichage et les paramètres d&apos;intégration.
        </p>
      </div>

      <form onSubmit={handleThresholdSubmit} className="grid gap-6 lg:grid-cols-2">
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
            disabled={loading}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
                  onClick={() => void handleTemperatureUnit(unit)}
                  disabled={loading}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    preferences.temperatureUnit === unit
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
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
                  onClick={() => void handleThemeChange(option.value)}
                  disabled={loading}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    preferences.theme === option.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-primary/40'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
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

      {role === 'supervisor' && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header>
            <h3 className="text-lg font-semibold text-slate-900">Configuration du broker MQTT</h3>
            <p className="text-sm text-slate-500">
              Paramétrez l’URL, les identifiants et le comportement du broker utilisé pour la cuverie.
            </p>
          </header>
          <form onSubmit={handleMqttSubmit} className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              URL du broker (wss://)
              <input
                value={mqttUrl}
                onChange={(event) => setMqttUrl(event.target.value)}
                placeholder="wss://broker.exemple:8883"
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Nom d’utilisateur
                <input
                  value={mqttUsername}
                  onChange={(event) => setMqttUsername(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoComplete="username"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Mot de passe
                <input
                  type="password"
                  value={mqttPassword}
                  onChange={(event) => setMqttPassword(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoComplete="current-password"
                />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Reconnect (ms)
                <input
                  type="number"
                  value={mqttReconnect}
                  onChange={(event) => setMqttReconnect(Number(event.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  min={500}
                  step={100}
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={mqttEnableMock}
                  onChange={(event) => setMqttEnableMock(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                />
                Activer le mode mock par défaut
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sauvegarder le broker
            </button>
          </form>
        </section>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          Chargement des paramètres…
        </div>
      )}
    </div>
  )
}

