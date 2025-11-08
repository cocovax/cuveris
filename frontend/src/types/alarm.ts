export type AlarmSeverity = 'info' | 'warning' | 'critical'

export interface Alarm {
  id: string
  tankId: string
  message: string
  severity: AlarmSeverity
  triggeredAt: string
  acknowledged: boolean
}

