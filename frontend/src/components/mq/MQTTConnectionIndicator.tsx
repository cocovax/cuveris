import { SignalIcon } from '../ui/icons/SignalIcon'
import { useMqttStore } from '../../store/mqttStore'

export function MQTTConnectionIndicator() {
  const { status, mode, lastMessageAt, messageIntervalMs, error } = useMqttStore()

  const statusColor =
    {
      connected: 'text-success',
      connecting: 'text-warning',
      disconnected: 'text-danger',
      error: 'text-danger',
    }[status] ?? 'text-slate-400'

  const modeLabel =
    mode === 'mock' ? 'Mode démonstration' : mode === 'socket' ? 'Mode socket' : 'Mode production'

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {modeLabel}
        </span>
        <div className="flex items-center gap-2">
          <SignalIcon className={`h-4 w-4 ${statusColor}`} />
          <span className="font-medium capitalize">{status}</span>
        </div>
      </div>
      {lastMessageAt && (
        <p className="mt-2 text-xs text-slate-500">
          Dernier message reçu à {lastMessageAt.toLocaleTimeString('fr-FR')}
          {typeof messageIntervalMs === 'number' ? ` · ${Math.round(messageIntervalMs / 1000)}s d'intervalle` : ''}
        </p>
      )}
      {error && <p className="mt-2 rounded-md bg-danger/10 px-2 py-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

