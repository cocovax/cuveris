import { type TankStatus } from '../../types'

const STATUS_LABELS: Record<TankStatus, string> = {
  idle: 'Veille',
  cooling: 'Refroidissement',
  heating: 'Chauffage',
  alarm: 'Alarme',
  offline: 'Hors ligne',
}

const STATUS_COLORS: Record<TankStatus, string> = {
  idle: 'bg-slate-200 text-slate-700',
  cooling: 'bg-sky-100 text-sky-700',
  heating: 'bg-amber-100 text-amber-700',
  alarm: 'bg-danger/10 text-danger',
  offline: 'bg-slate-200 text-slate-400',
}

interface TankStatusPillProps {
  status: TankStatus
}

export function TankStatusPill({ status }: TankStatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

