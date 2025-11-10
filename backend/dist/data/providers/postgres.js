"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostgresAdapters = exports.PostgresTemperatureHistoryAdapter = exports.PostgresEventLogAdapter = void 0;
const pg_1 = require("pg");
class PostgresEventLogAdapter {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async list(limit) {
        const result = await this.pool.query(`SELECT id, timestamp, tank_id AS "tankId", category, source, summary, details, metadata
       FROM event_log
       ORDER BY timestamp DESC
       LIMIT $1`, [limit]);
        return result.rows;
    }
    async append(entry) {
        await this.pool.query(`INSERT INTO event_log (id, timestamp, tank_id, category, source, summary, details, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            entry.id,
            entry.timestamp,
            entry.tankId ?? null,
            entry.category,
            entry.source,
            entry.summary,
            entry.details ?? null,
            entry.metadata ?? null,
        ]);
    }
}
exports.PostgresEventLogAdapter = PostgresEventLogAdapter;
class PostgresTemperatureHistoryAdapter {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async list(tankId, limit) {
        const result = await this.pool.query(`SELECT timestamp, value
       FROM temperature_samples
       WHERE tank_id = $1
       ORDER BY timestamp DESC
       LIMIT $2`, [tankId, limit]);
        return result.rows.reverse();
    }
    async append(tankId, sample) {
        await this.pool.query(`INSERT INTO temperature_samples (tank_id, timestamp, value)
       VALUES ($1, $2, $3)`, [tankId, sample.timestamp, sample.value]);
    }
}
exports.PostgresTemperatureHistoryAdapter = PostgresTemperatureHistoryAdapter;
const createPostgresAdapters = (config) => {
    const baseOptions = {
        connectionString: config.eventConnectionString,
        statement_timeout: config.statementTimeoutMs ?? 5000,
    };
    const eventPool = new pg_1.Pool(baseOptions);
    const timeseriesPool = config.timeseriesConnectionString && config.timeseriesConnectionString !== config.eventConnectionString
        ? new pg_1.Pool({
            connectionString: config.timeseriesConnectionString,
            statement_timeout: config.statementTimeoutMs ?? 5000,
        })
        : eventPool;
    const events = new PostgresEventLogAdapter(eventPool);
    const temperatureHistory = new PostgresTemperatureHistoryAdapter(timeseriesPool);
    return {
        events,
        temperatureHistory,
        close: async () => {
            await Promise.all([eventPool.end(), timeseriesPool.end()]);
        },
    };
};
exports.createPostgresAdapters = createPostgresAdapters;
//# sourceMappingURL=postgres.js.map