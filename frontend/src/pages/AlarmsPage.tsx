import { AlarmList } from '../components/alarms/AlarmList'
import { useTankStore } from '../store/tankStore'

export function AlarmsPage() {
  const alarms = useTankStore((state) => state.alarms)
  const acknowledge = useTankStore((state) => state.acknowledgeAlarm)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Alarmes</h2>
        <p className="text-sm text-slate-500">Surveillez les dépassements de seuil et avertissements en temps réel.</p>
      </div>
      <AlarmList alarms={alarms} onAcknowledge={acknowledge} />
    </div>
  )
}

