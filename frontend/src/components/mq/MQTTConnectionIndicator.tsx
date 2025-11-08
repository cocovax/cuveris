import { SignalIcon } from '../ui/icons/SignalIcon'
import { useMqttStore } from '../../store/mqttStore'

export function MQTTConnectionIndicator() {
  const { status, lastMessageAt } = useMqttStore()

  const statusColor = {
    connected: 'text-success',
    connecting: 'text-warning',
    disconnected: 'text-danger',
  }[status]

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <SignalIcon className={`h-4 w-4 ${statusColor}`} />
        <span className="font-medium capitalize">{status}</span>
      </div>
      {lastMessageAt && (
        <p className="mt-1 text-xs text-slate-500">
          Dernier message: {lastMessageAt.toLocaleTimeString('fr-FR')}
        </p>
      )}
    </div>
  )
}

