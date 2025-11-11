import { Pool } from 'pg';
import { type EventLogEntry } from '../../domain/eventLog';
import { type TemperatureSample } from '../../domain/models';
export interface PostgresProviderConfig {
    eventConnectionString: string;
    timeseriesConnectionString?: string;
    statementTimeoutMs?: number;
}
export declare class PostgresEventLogAdapter {
    private readonly pool;
    constructor(pool: Pool);
    list(limit: number): Promise<EventLogEntry[]>;
    append(entry: EventLogEntry): Promise<void>;
}
export declare class PostgresTemperatureHistoryAdapter {
    private readonly pool;
    constructor(pool: Pool);
    list(tankIx: number, limit: number): Promise<TemperatureSample[]>;
    append(tankIx: number, sample: TemperatureSample): Promise<void>;
}
export declare const createPostgresAdapters: (config: PostgresProviderConfig) => {
    events: PostgresEventLogAdapter;
    temperatureHistory: PostgresTemperatureHistoryAdapter;
    close: () => Promise<void>;
};
//# sourceMappingURL=postgres.d.ts.map