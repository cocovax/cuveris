import {
  type Alarm,
  type CuverieConfig,
  type EventLogEntry,
  type GeneralMode,
  type SettingsState,
  type Tank,
  type TankContents,
  type TemperatureReading,
} from '../types'
import { httpClient } from './httpClient'
import { appConfig } from '../config/app'

const useMocks = appConfig.enableMocks

const MOCK_TANKS: Tank[] = [
  {
    ix: 101,
    id: 'tank-01',
    name: 'Cuve 01',
    status: 'cooling',
    temperature: 18.4,
    setpoint: 18.0,
    capacityLiters: 5000,
    fillLevelPercent: 72,
    contents: { grape: 'Chardonnay', vintage: 2024, volumeLiters: 3600 },
    lastUpdatedAt: new Date().toISOString(),
    isRunning: true,
    alarms: [],
    history: generateHistory(18, 19.4),
    cuverieId: 'default',
    isDeleted: false,
  },
  {
    ix: 102,
    id: 'tank-02',
    name: 'Cuve 02',
    status: 'idle',
    temperature: 21.1,
    setpoint: 21.0,
    capacityLiters: 6000,
    fillLevelPercent: 55,
    contents: { grape: 'Sauvignon', vintage: 2023, volumeLiters: 3300 },
    lastUpdatedAt: new Date().toISOString(),
    isRunning: false,
    alarms: [],
    history: generateHistory(20.5, 22),
    cuverieId: 'default',
    isDeleted: false,
  },
  {
    ix: 103,
    id: 'tank-03',
    name: 'Cuve 03',
    status: 'alarm',
    temperature: 25.8,
    setpoint: 23.0,
    capacityLiters: 4500,
    fillLevelPercent: 91,
    contents: { grape: 'Merlot', vintage: 2024, volumeLiters: 4095 },
    lastUpdatedAt: new Date().toISOString(),
    isRunning: true,
    alarms: ['Température haute'],
    history: generateHistory(22.5, 26.2),
    cuverieId: 'default',
    isDeleted: false,
  },
]

const MOCK_ALARMS: Alarm[] = [
  {
    id: 'alarm-001',
    tankIx: 103,
    message: 'Température supérieure au seuil haut (+2.8°C)',
    severity: 'critical',
    triggeredAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    acknowledged: false,
  },
]

function generateHistory(min: number, max: number, points = 48): TemperatureReading[] {
  const data: TemperatureReading[] = []
  const now = Date.now()
  for (let i = points - 1; i >= 0; i -= 1) {
    const timestamp = new Date(now - i * 30 * 60 * 1000).toISOString()
    const value = Number((min + Math.random() * (max - min)).toFixed(2))
    data.push({ timestamp, value })
  }
  return data
}

const simulateNetwork = async (ms = 400) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

const MOCK_CUVERIES: CuverieConfig[] = [
  {
    id: 'default',
    name: 'Cuverie',
    mode: 'ARRET',
    tanks: [
      { id: 'tank-01', ix: 101, displayName: 'Cuve 01', order: 1 },
      { id: 'tank-02', ix: 102, displayName: 'Cuve 02', order: 2 },
      { id: 'tank-03', ix: 103, displayName: 'Cuve 03', order: 3 },
    ],
  },
]

export async function fetchTanks(): Promise<Tank[]> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork()
    return structuredClone(MOCK_TANKS).filter((tank) => !tank.isDeleted)
  }
  const response = await httpClient.get<{ data: Tank[] }>('/api/tanks')
  return response.data.data.filter((tank) => !tank.isDeleted)
}

export async function fetchTankByIx(ix: number): Promise<Tank | undefined> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork()
    const tank = MOCK_TANKS.find((tank) => tank.ix === ix)
    if (!tank || tank.isDeleted) return undefined
    return structuredClone(tank)
  }
  try {
    const response = await httpClient.get<{ data: Tank }>(`/api/tanks/${ix}`)
    const tank = response.data.data
    if (tank.isDeleted) return undefined
    return tank
  } catch (error) {
    console.warn('[API] Tank introuvable', ix, error)
    return undefined
  }
}

export async function updateTankSetpoint(ix: number, setpoint: number): Promise<Tank | undefined> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork(250)
    const tank = MOCK_TANKS.find((item) => item.ix === ix)
    if (!tank || tank.isDeleted) return undefined
    tank.setpoint = setpoint
    tank.lastUpdatedAt = new Date().toISOString()
    return structuredClone(tank)
  }
  const response = await httpClient.post<{ data: Tank }>(`/api/tanks/${ix}/setpoint`, { value: setpoint })
  return response.data.data
}

export async function toggleTank(ix: number, isRunning: boolean): Promise<Tank | undefined> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork(250)
    const tank = MOCK_TANKS.find((item) => item.ix === ix)
    if (!tank || tank.isDeleted) return undefined
    tank.isRunning = isRunning
    tank.status = isRunning ? 'cooling' : 'idle'
    tank.lastUpdatedAt = new Date().toISOString()
    return structuredClone(tank)
  }
  const response = await httpClient.post<{ data: Tank }>(`/api/tanks/${ix}/running`, { value: isRunning })
  return response.data.data
}

export async function fetchAlarms(): Promise<Alarm[]> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork()
    return structuredClone(MOCK_ALARMS)
  }
  const response = await httpClient.get<{ data: Alarm[] }>('/api/alarms')
  return response.data.data
}

export async function acknowledgeAlarm(id: string): Promise<Alarm | undefined> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork(250)
    const alarm = MOCK_ALARMS.find((item) => item.id === id)
    if (!alarm) return undefined
    alarm.acknowledged = true
    return structuredClone(alarm)
  }
  const response = await httpClient.post<{ data: Alarm }>(`/api/alarms/${id}/acknowledge`)
  return response.data.data
}

export async function fetchTankHistory(ix: number): Promise<TemperatureReading[]> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork()
    const tank = MOCK_TANKS.find((item) => item.ix === ix)
    if (!tank || tank.isDeleted) return []
    return structuredClone(tank.history ?? [])
  }
  try {
    const response = await httpClient.get<{ data: Tank }>(`/api/tanks/${ix}`)
    return response.data.data.history ?? []
  } catch (error) {
    console.warn('[API] Historique indisponible pour la cuve', ix, error)
    return []
  }
}

export async function updateTankContents(ix: number, contents: TankContents): Promise<Tank | undefined> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork(250)
    const tank = MOCK_TANKS.find((item) => item.ix === ix)
    if (!tank || tank.isDeleted) return undefined
    tank.contents = { ...contents }
    tank.lastUpdatedAt = new Date().toISOString()
    return structuredClone(tank)
  }
  const response = await httpClient.post<{ data: Tank }>(`/api/tanks/${ix}/contents`, contents)
  return response.data.data
}

export async function fetchEventLog(limit = 100): Promise<EventLogEntry[]> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork()
    return Array.from({ length: Math.min(limit, 30) }).map((_, index) => ({
      id: `event-${index}`,
      timestamp: new Date(Date.now() - index * 60_000).toISOString(),
      category: index % 3 === 0 ? 'command' : index % 3 === 1 ? 'telemetry' : 'alarm',
      source: index % 2 === 0 ? 'user' : 'system',
      tankIx: index % 2 === 0 ? 101 : 102,
      summary:
        index % 3 === 0
          ? 'Modification consigne'
          : index % 3 === 1
            ? 'Lecture télémétrie reçue'
            : 'Alarme acquittée',
      details:
        index % 3 === 0
          ? 'Consigne passée à 19.0°C'
          : index % 3 === 1
            ? 'Température 18.7°C'
            : 'Alarme haute acquittée depuis mobile',
    }))
  }
  const response = await httpClient.get<{ data: EventLogEntry[] }>('/api/events', {
    params: { limit },
  })
  return response.data.data
}

export async function fetchConfig(): Promise<CuverieConfig[]> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork()
    return structuredClone(MOCK_CUVERIES)
  }
  const response = await httpClient.get<{ data: CuverieConfig[] }>('/api/config')
  return response.data.data
}

export async function setCuverieMode(cuverieId: string, mode: GeneralMode): Promise<GeneralMode | undefined> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork(200)
    const cuverie = MOCK_CUVERIES.find((item) => item.id === cuverieId)
    if (!cuverie) return undefined
    cuverie.mode = mode
    return mode
  }
  const response = await httpClient.post<{ data: { mode: GeneralMode } }>(`/api/cuveries/${cuverieId}/mode`, {
    mode,
  })
  return response.data.data.mode
}

export async function fetchSettingsState(): Promise<SettingsState> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork()
    return {
      alarmThresholds: { high: 26, low: 16 },
      preferences: { locale: 'fr-FR', temperatureUnit: 'C', theme: 'auto' },
      mqtt: {
        url: undefined,
        username: undefined,
        password: undefined,
        reconnectPeriod: 2000,
        enableMock: true,
      },
    }
  }
  const response = await httpClient.get<{ data: SettingsState }>('/api/settings')
  return response.data.data
}

type SettingsUpdatePayload = {
  alarmThresholds?: Partial<SettingsState['alarmThresholds']>
  preferences?: Partial<SettingsState['preferences']>
  mqtt?: Partial<SettingsState['mqtt']>
}

export async function updateSettingsState(payload: SettingsUpdatePayload): Promise<SettingsState> {
  if (useMocks || !appConfig.apiUrl) {
    await simulateNetwork(200)
    const current = await fetchSettingsState()
    return {
      alarmThresholds: {
        ...current.alarmThresholds,
        ...(payload.alarmThresholds ?? {}),
      },
      preferences: {
        ...current.preferences,
        ...(payload.preferences ?? {}),
      },
      mqtt: {
        ...current.mqtt,
        ...(payload.mqtt ?? {}),
      },
    }
  }
  const response = await httpClient.patch<{ data: SettingsState }>('/api/settings', payload)
  return response.data.data
}

