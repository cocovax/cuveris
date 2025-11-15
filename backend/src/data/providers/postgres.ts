import { Pool } from 'pg'
import { type EventLogEntry } from '../../domain/eventLog'
import { type TemperatureSample } from '../../domain/models'

export interface PostgresProviderConfig {
  eventConnectionString: string
  timeseriesConnectionString?: string
  statementTimeoutMs?: number
}

export class PostgresEventLogAdapter {
  constructor(private readonly pool: Pool) {}

  async list(limit: number): Promise<EventLogEntry[]> {
    const result = await this.pool.query<EventLogEntry>(
      `SELECT id, timestamp, tank_ix AS "tankIx", category, source, summary, details, metadata
       FROM event_log
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit],
    )
    return result.rows
  }

  async append(entry: EventLogEntry): Promise<void> {
    await this.pool.query(
      `INSERT INTO event_log (id, timestamp, tank_ix, category, source, summary, details, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.id,
        entry.timestamp,
        entry.tankIx ?? null,
        entry.category,
        entry.source,
        entry.summary,
        entry.details ?? null,
        entry.metadata ?? null,
      ],
    )
  }
}

export class PostgresTemperatureHistoryAdapter {
  constructor(private readonly pool: Pool) {}

  async list(tankIx: number, limit: number): Promise<TemperatureSample[]> {
    const result = await this.pool.query(
      `SELECT timestamp, value
       FROM temperature_samples
       WHERE tank_ix = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [tankIx, limit],
    )
    return result.rows.reverse()
  }

  async append(tankIx: number, sample: TemperatureSample): Promise<void> {
    await this.pool.query(
      `INSERT INTO temperature_samples (tank_ix, timestamp, value)
       VALUES ($1, $2, $3)`,
      [tankIx, sample.timestamp, sample.value],
    )
  }
}

export const createPostgresAdapters = (config: PostgresProviderConfig) => {
  const baseOptions = {
    connectionString: config.eventConnectionString,
    statement_timeout: config.statementTimeoutMs ?? 5000,
  }

  const eventPool = new Pool(baseOptions)
  const timeseriesPool =
    config.timeseriesConnectionString && config.timeseriesConnectionString !== config.eventConnectionString
      ? new Pool({
          connectionString: config.timeseriesConnectionString,
          statement_timeout: config.statementTimeoutMs ?? 5000,
        })
      : eventPool

  const events = new PostgresEventLogAdapter(eventPool)
  const temperatureHistory = new PostgresTemperatureHistoryAdapter(timeseriesPool)

  return {
    events,
    temperatureHistory,
    close: async () => {
      await Promise.all([eventPool.end(), timeseriesPool.end()])
    },
  }
}

