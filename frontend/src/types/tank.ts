export type TankStatus = 'idle' | 'cooling' | 'heating' | 'alarm' | 'offline'

export interface TankContents {
  grape: string
  vintage: number
  volumeLiters: number
  notes?: string
}

export interface TemperatureReading {
  timestamp: string
  value: number
}

export interface Tank {
  id: string
  name: string
  status: TankStatus
  temperature: number
  setpoint: number
  capacityLiters: number
  fillLevelPercent: number
  contents?: TankContents
  lastUpdatedAt: string
  isRunning: boolean
  alarms: string[]
  history: TemperatureReading[]
}

