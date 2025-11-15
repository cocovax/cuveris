"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPostgresAdapters = exports.PostgresTankAdapter = exports.PostgresTemperatureHistoryAdapter = exports.PostgresEventLogAdapter = void 0;
const pg_1 = require("pg");
class PostgresEventLogAdapter {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async list(limit) {
        const result = await this.pool.query(`SELECT id, timestamp, tank_ix AS "tankIx", category, source, summary, details, metadata
       FROM event_log
       ORDER BY timestamp DESC
       LIMIT $1`, [limit]);
        return result.rows;
    }
    async append(entry) {
        await this.pool.query(`INSERT INTO event_log (id, timestamp, tank_ix, category, source, summary, details, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
            entry.id,
            entry.timestamp,
            entry.tankIx ?? null,
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
    async list(tankIx, limit) {
        const result = await this.pool.query(`SELECT timestamp, value
       FROM temperature_samples
       WHERE tank_ix = $1
       ORDER BY timestamp DESC
       LIMIT $2`, [tankIx, limit]);
        return result.rows.reverse();
    }
    async append(tankIx, sample) {
        await this.pool.query(`INSERT INTO temperature_samples (tank_ix, timestamp, value)
       VALUES ($1, $2, $3)`, [tankIx, sample.timestamp, sample.value]);
    }
}
exports.PostgresTemperatureHistoryAdapter = PostgresTemperatureHistoryAdapter;
class PostgresTankAdapter {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getByIx(ix) {
        const result = await this.pool.query(`SELECT ix, id, name, status, temperature, setpoint, capacity_liters, fill_level_percent,
              contents, is_running, last_updated_at, cuverie_id, is_deleted
       FROM tanks
       WHERE ix = $1 AND is_deleted = FALSE`, [ix]);
        if (result.rows.length === 0)
            return undefined;
        const row = result.rows[0];
        if (!row)
            return undefined;
        const tank = {
            ix: row.ix,
            id: row.id,
            name: row.name,
            status: row.status,
            temperature: row.temperature,
            setpoint: row.setpoint,
            capacityLiters: row.capacity_liters,
            fillLevelPercent: row.fill_level_percent,
            isRunning: row.is_running,
            lastUpdatedAt: row.last_updated_at,
            isDeleted: row.is_deleted,
            history: [], // L'historique est chargé séparément
            alarms: [], // Les alarmes sont gérées séparément
        };
        if (row.contents) {
            tank.contents = row.contents;
        }
        if (row.cuverie_id) {
            tank.cuverieId = row.cuverie_id;
        }
        return tank;
    }
    async list() {
        const result = await this.pool.query(`SELECT ix, id, name, status, temperature, setpoint, capacity_liters, fill_level_percent,
              contents, is_running, last_updated_at, cuverie_id, is_deleted
       FROM tanks
       WHERE is_deleted = FALSE
       ORDER BY ix`);
        return result.rows.map((row) => {
            const tank = {
                ix: row.ix,
                id: row.id,
                name: row.name,
                status: row.status,
                temperature: row.temperature,
                setpoint: row.setpoint,
                capacityLiters: row.capacity_liters,
                fillLevelPercent: row.fill_level_percent,
                isRunning: row.is_running,
                lastUpdatedAt: row.last_updated_at,
                isDeleted: row.is_deleted,
                history: [], // L'historique est chargé séparément
                alarms: [], // Les alarmes sont gérées séparément
            };
            if (row.contents) {
                tank.contents = row.contents;
            }
            if (row.cuverie_id) {
                tank.cuverieId = row.cuverie_id;
            }
            return tank;
        });
    }
    async upsert(tank) {
        await this.pool.query(`INSERT INTO tanks (
         ix, id, name, status, temperature, setpoint, capacity_liters, fill_level_percent,
         contents, is_running, last_updated_at, cuverie_id, is_deleted, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
       ON CONFLICT (ix) DO UPDATE SET
         id = EXCLUDED.id,
         name = EXCLUDED.name,
         status = EXCLUDED.status,
         temperature = EXCLUDED.temperature,
         setpoint = EXCLUDED.setpoint,
         capacity_liters = EXCLUDED.capacity_liters,
         fill_level_percent = EXCLUDED.fill_level_percent,
         contents = EXCLUDED.contents,
         is_running = EXCLUDED.is_running,
         last_updated_at = EXCLUDED.last_updated_at,
         cuverie_id = EXCLUDED.cuverie_id,
         is_deleted = EXCLUDED.is_deleted,
         updated_at = NOW()`, [
            tank.ix,
            tank.id,
            tank.name,
            tank.status,
            tank.temperature,
            tank.setpoint,
            tank.capacityLiters,
            tank.fillLevelPercent,
            tank.contents ? JSON.stringify(tank.contents) : null,
            tank.isRunning,
            tank.lastUpdatedAt,
            tank.cuverieId ?? null,
            tank.isDeleted,
        ]);
    }
    async markAsDeleted(ix) {
        await this.pool.query(`UPDATE tanks SET is_deleted = TRUE, updated_at = NOW() WHERE ix = $1`, [ix]);
    }
}
exports.PostgresTankAdapter = PostgresTankAdapter;
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
    const tanks = new PostgresTankAdapter(eventPool);
    return {
        events,
        temperatureHistory,
        tanks,
        close: async () => {
            await Promise.all([eventPool.end(), timeseriesPool.end()]);
        },
    };
};
exports.createPostgresAdapters = createPostgresAdapters;
//# sourceMappingURL=postgres.js.map