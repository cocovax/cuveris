import { type Alarm } from '../../types'

interface AlarmListProps {
  alarms: Alarm[]
}

const severityColor: Record<Alarm['severity'], string> = {
  info: 'bg-sky-100 text-sky-700',
  warning: 'bg-amber-100 text-amber-700',
  critical: 'bg-danger/10 text-danger',
}

export function AlarmList({ alarms }: AlarmListProps) {
  if (alarms.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-sm">
        Aucune alarme active 🎉
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left">
            <th className="px-4 py-3 font-semibold text-slate-500">Cuve</th>
            <th className="px-4 py-3 font-semibold text-slate-500">Message</th>
            <th className="px-4 py-3 font-semibold text-slate-500">Gravité</th>
            <th className="px-4 py-3 font-semibold text-slate-500">Déclenchée</th>
            <th className="px-4 py-3 font-semibold text-slate-500">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {alarms.map((alarm) => (
            <tr key={alarm.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{alarm.tankId}</td>
              <td className="px-4 py-3 text-slate-600">{alarm.message}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityColor[alarm.severity]}`}
                >
                  {alarm.severity}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(alarm.triggeredAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                    alarm.acknowledged ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                  }`}
                >
                  {alarm.acknowledged ? 'Acquittée' : 'Active'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

