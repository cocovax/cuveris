export type TankStatus = 'idle' | 'cooling' | 'heating' | 'alarm' | 'offline'

export interface TankContents {
  grape: string
  vintage: number
  volumeLiters: number
  notes?: string
}

export interface TemperatureSample {
  timestamp: string
  value: number
}

export interface Tank {
  ix: number
  id: string
  name: string
  status: TankStatus
  temperature: number
  setpoint: number
  capacityLiters: number
  fillLevelPercent: number
  contents?: TankContents
  isRunning: boolean
  lastUpdatedAt: string
  history: TemperatureSample[]
  alarms: string[]
  cuverieId?: string
  isDeleted: boolean
}

export type AlarmSeverity = 'info' | 'warning' | 'critical'

export interface Alarm {
  id: string
  tankIx: number
  severity: AlarmSeverity
  message: string
  triggeredAt: string
  acknowledged: boolean
}

export interface AlarmThresholds {
  high: number
  low: number
}

export type TemperatureUnit = 'C' | 'F'

export interface UserPreferences {
  locale: string
  temperatureUnit: TemperatureUnit
  theme: 'light' | 'dark' | 'auto'
}

export interface Settings {
  alarmThresholds: AlarmThresholds
  preferences: UserPreferences
  mqtt: {
    url?: string
    username?: string
    password?: string
    reconnectPeriod: number
    enableMock: boolean
  }
}

