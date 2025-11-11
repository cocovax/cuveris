import {
  type DataContext,
  type TankStore,
  type TankUpdater,
  type AlarmStore,
  type AlarmUpdater,
  type SettingsStore,
  type TemperatureHistoryStore,
  type EventLogStore,
  type CuverieStore,
  type GeneralModeStore,
} from '../interfaces'
import { type Alarm, type Settings, type Tank, type TemperatureSample } from '../../domain/models'
import { type EventLogEntry } from '../../domain/eventLog'
import { type CuverieConfig, type GeneralMode } from '../../domain/config'
import { env } from '../../config/env'

const now = () => new Date().toISOString()

const cloneTank = (tank: Tank, history: TemperatureSample[]): Tank => ({
  ...tank,
  history: [...history],
})

const generateHistory = (min: number, max: number, points = 48): TemperatureSample[] => {
  const data: TemperatureSample[] = []
  const current = Date.now()
  for (let i = points - 1; i >= 0; i -= 1) {
    const timestamp = new Date(current - i * 30 * 60 * 1000).toISOString()
    const value = Number((min + Math.random() * (max - min)).toFixed(2))
    data.push({ timestamp, value })
  }
  return data
}

const seedTanks: Tank[] = [
  {
    id: 'tank-01',
    name: 'Cuve 01',
    status: 'cooling',
    temperature: 18.4,
    setpoint: 18.0,
    capacityLiters: 5000,
    fillLevelPercent: 72,
    contents: { grape: 'Chardonnay', vintage: 2024, volumeLiters: 3600 },
    isRunning: true,
    lastUpdatedAt: now(),
    history: [],
    alarms: [],
    cuverieId: 'default',
  },
  {
    id: 'tank-02',
    name: 'Cuve 02',
    status: 'idle',
    temperature: 21.1,
    setpoint: 21.0,
    capacityLiters: 6000,
    fillLevelPercent: 55,
    contents: { grape: 'Sauvignon', vintage: 2023, volumeLiters: 3300 },
    isRunning: false,
    lastUpdatedAt: now(),
    history: [],
    alarms: [],
    cuverieId: 'default',
  },
  {
    id: 'tank-03',
    name: 'Cuve 03',
    status: 'alarm',
    temperature: 25.9,
    setpoint: 23.0,
    capacityLiters: 4500,
    fillLevelPercent: 91,
    contents: { grape: 'Merlot', vintage: 2024, volumeLiters: 4095 },
    isRunning: true,
    lastUpdatedAt: now(),
    history: [],
    alarms: ['Température haute'],
    cuverieId: 'default',
  },
]

const seedAlarms: Alarm[] = [
  {
    id: 'alarm-001',
    tankId: 'tank-03',
    severity: 'critical',
    message: 'Température supérieure au seuil haut (+2.9°C)',
    triggeredAt: new Date(Date.now() - 1_800_000).toISOString(),
    acknowledged: false,
  },
]

const initialMqtt: Settings['mqtt'] = {
  reconnectPeriod: env.mqtt.reconnectPeriod,
  enableMock: env.mqtt.enableMock,
}
if (env.mqtt.url) {
  initialMqtt.url = env.mqtt.url
}
if (env.mqtt.username) {
  initialMqtt.username = env.mqtt.username
}
if (env.mqtt.password) {
  initialMqtt.password = env.mqtt.password
}

const seedSettings: Settings = {
  alarmThresholds: {
    high: 26,
    low: 16,
  },
  preferences: {
    locale: 'fr-FR',
    temperatureUnit: 'C',
    theme: 'auto',
  },
  mqtt: initialMqtt,
}

const tanksMap = new Map<string, Tank>()
const historyMap = new Map<string, TemperatureSample[]>()
const alarmsList: Alarm[] = []
let storedSettings = structuredClone(seedSettings)
const eventLog: EventLogEntry[] = []
const cuveries = new Map<string, CuverieConfig>()
const generalModes = new Map<string, GeneralMode>()

const initialise = () => {
  seedTanks.forEach((tank) => {
    const history = generateHistory(tank.temperature - 1, tank.temperature + 1.5)
    historyMap.set(tank.id, history)
    tanksMap.set(tank.id, { ...tank, history: [] })
  })
  seedAlarms.forEach((alarm) => alarmsList.push({ ...alarm }))
  const defaultCuverie: CuverieConfig = {
    id: 'default',
    name: 'Cuverie',
    tanks: seedTanks.map((tank, index) => ({
      id: tank.id,
      ix: 100 + index,
      displayName: tank.name,
      order: index,
    })),
  }
  cuveries.set(defaultCuverie.id, defaultCuverie)
  generalModes.set(defaultCuverie.id, 'ARRET')
}

initialise()

const buildTankStore = (): TankStore => ({
  list: () =>
    Array.from(tanksMap.values()).map((tank) => cloneTank(tank, historyMap.get(tank.id) ?? [])),
  getById: (id) => {
    const tank = tanksMap.get(id)
    if (!tank) return undefined
    const history = historyMap.get(id) ?? []
    return cloneTank(tank, history)
  },
  update: (id: string, updater: TankUpdater) => {
    const current = tanksMap.get(id)
    if (!current) return undefined
    const history = historyMap.get(id) ?? []
    const candidate = cloneTank(current, history)
    const updated = updater(candidate)
    historyMap.set(id, [...updated.history])
    const stored: Tank = {
      ...updated,
      history: [],
      lastUpdatedAt: now(),
    }
    tanksMap.set(id, stored)
    return cloneTank(stored, historyMap.get(id) ?? [])
  },
  create: (tank: Tank) => {
    tanksMap.set(tank.id, { ...tank, history: [] })
    historyMap.set(tank.id, [...tank.history])
    return cloneTank(tank, tank.history)
  },
})

const buildAlarmStore = (): AlarmStore => ({
  list: () => alarmsList.map((alarm) => ({ ...alarm })),
  add: (alarm: Alarm) => {
    const stored = { ...alarm }
    alarmsList.unshift(stored)
    return { ...stored }
  },
  update: (id: string, updater: AlarmUpdater) => {
    const index = alarmsList.findIndex((alarm) => alarm.id === id)
    if (index === -1) return undefined
    const current = { ...alarmsList[index] } as Alarm
    const updated = updater(current)
    alarmsList[index] = updated
    return { ...updated }
  },
})

const buildSettingsStore = (): SettingsStore => ({
  get: () => structuredClone(storedSettings),
  update: (payload) => {
    storedSettings = {
      ...storedSettings,
      ...payload,
      alarmThresholds: {
        ...storedSettings.alarmThresholds,
        ...(payload.alarmThresholds ?? {}),
      },
      preferences: {
        ...storedSettings.preferences,
        ...(payload.preferences ?? {}),
      },
      mqtt: {
        ...storedSettings.mqtt,
        ...(payload.mqtt ?? {}),
      },
    }
    return structuredClone(storedSettings)
  },
})

const buildHistoryStore = (): TemperatureHistoryStore => ({
  list: (tankId, limit) => {
    const history = historyMap.get(tankId) ?? []
    if (history.length <= limit) return [...history]
    return history.slice(history.length - limit)
  },
  append: (tankId, sample) => {
    const history = historyMap.get(tankId) ?? []
    history.push(sample)
    historyMap.set(tankId, history.slice(-48))
    const tank = tanksMap.get(tankId)
    if (tank) {
      tanksMap.set(tankId, { ...tank, lastUpdatedAt: sample.timestamp })
    }
  },
})

const buildEventLogStore = (): EventLogStore => ({
  list: (limit) => eventLog.slice(0, limit).map((entry) => ({ ...entry })),
  append: (entry) => {
    eventLog.unshift({ ...entry })
    if (eventLog.length > 500) {
      eventLog.splice(500)
    }
  },
})

const buildCuverieStore = (): CuverieStore => ({
  list: () => Array.from(cuveries.values()).map((cuverie) => ({
    ...cuverie,
    tanks: cuverie.tanks.map((tank) => ({ ...tank })),
  })),
  upsert: (cuverie) => {
    cuveries.set(cuverie.id, {
      ...cuverie,
      tanks: cuverie.tanks.map((tank) => ({ ...tank })),
    })
  },
  deleteById: (id: string) => {
    cuveries.delete(id)
  },
})

const buildGeneralModeStore = (): GeneralModeStore => ({
  get: (cuverieId) => generalModes.get(cuverieId),
  set: (cuverieId, mode) => {
    generalModes.set(cuverieId, mode)
  },
})

export const createInMemoryDataContext = (): DataContext => ({
  tanks: buildTankStore(),
  alarms: buildAlarmStore(),
  settings: buildSettingsStore(),
  temperatureHistory: buildHistoryStore(),
  events: buildEventLogStore(),
  cuveries: buildCuverieStore(),
  generalModes: buildGeneralModeStore(),
})

