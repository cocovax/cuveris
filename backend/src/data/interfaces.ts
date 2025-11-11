import { type Alarm, type Settings, type Tank, type TemperatureSample } from '../domain/models'
import { type EventLogEntry } from '../domain/eventLog'
import { type CuverieConfig, type GeneralMode } from '../domain/config'

export type TankUpdater = (tank: Tank) => Tank
export type AlarmUpdater = (alarm: Alarm) => Alarm

export interface TankStore {
  list(): Tank[]
  getByIx(ix: number): Tank | undefined
  update(ix: number, updater: TankUpdater): Tank | undefined
  create(tank: Tank): Tank
}

export interface AlarmStore {
  list(): Alarm[]
  add(alarm: Alarm): Alarm
  update(id: string, updater: AlarmUpdater): Alarm | undefined
}

export interface SettingsStore {
  get(): Settings
  update(payload: Partial<Settings>): Settings
}

export interface TemperatureHistoryStore {
  list(tankIx: number, limit: number): TemperatureSample[]
  append(tankIx: number, sample: TemperatureSample): void
}

export interface EventLogStore {
  list(limit: number): EventLogEntry[]
  append(entry: EventLogEntry): void
}

export interface CuverieStore {
  list(): CuverieConfig[]
  upsert(cuverie: CuverieConfig): void
  deleteById(id: string): void
}

export interface GeneralModeStore {
  get(cuverieId: string): GeneralMode | undefined
  set(cuverieId: string, mode: GeneralMode): void
}

export interface DataContext {
  tanks: TankStore
  alarms: AlarmStore
  settings: SettingsStore
  temperatureHistory: TemperatureHistoryStore
  events: EventLogStore
  cuveries: CuverieStore
  generalModes: GeneralModeStore
}

