import { type Alarm, type Settings, type Tank, type TemperatureSample } from '../domain/models';
import { type EventLogEntry } from '../domain/eventLog';
export type TankUpdater = (tank: Tank) => Tank;
export type AlarmUpdater = (alarm: Alarm) => Alarm;
export interface TankStore {
    list(): Tank[];
    getById(id: string): Tank | undefined;
    update(id: string, updater: TankUpdater): Tank | undefined;
}
export interface AlarmStore {
    list(): Alarm[];
    add(alarm: Alarm): Alarm;
    update(id: string, updater: AlarmUpdater): Alarm | undefined;
}
export interface SettingsStore {
    get(): Settings;
    update(payload: Partial<Settings>): Settings;
}
export interface TemperatureHistoryStore {
    list(tankId: string, limit: number): TemperatureSample[];
    append(tankId: string, sample: TemperatureSample): void;
}
export interface EventLogStore {
    list(limit: number): EventLogEntry[];
    append(entry: EventLogEntry): void;
}
export interface DataContext {
    tanks: TankStore;
    alarms: AlarmStore;
    settings: SettingsStore;
    temperatureHistory: TemperatureHistoryStore;
    events: EventLogStore;
}
//# sourceMappingURL=interfaces.d.ts.map