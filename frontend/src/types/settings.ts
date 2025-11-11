export type TemperatureUnit = 'C' | 'F'

export interface AlarmThresholds {
  high: number
  low: number
}

export interface UserPreferences {
  locale: string
  temperatureUnit: TemperatureUnit
  theme: 'light' | 'dark' | 'auto'
}

export interface SettingsState {
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

