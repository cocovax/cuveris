export type AlarmSeverity = 'info' | 'warning' | 'critical'

export interface Alarm {
  id: string
  tankIx: number
  message: string
  severity: AlarmSeverity
  triggeredAt: string
  acknowledged: boolean
}

