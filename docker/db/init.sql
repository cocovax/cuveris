CREATE TABLE IF NOT EXISTS event_log (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    tank_id TEXT,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    summary TEXT NOT NULL,
    details TEXT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS temperature_samples (
    tank_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (tank_id, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_event_log_timestamp ON event_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_temperature_samples_timestamp ON temperature_samples (tank_id, timestamp DESC);

