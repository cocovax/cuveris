CREATE TABLE IF NOT EXISTS event_log (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    tank_ix INTEGER,
    category TEXT NOT NULL,
    source TEXT NOT NULL,
    summary TEXT NOT NULL,
    details TEXT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS temperature_samples (
    tank_ix INTEGER NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (tank_ix, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_event_log_timestamp ON event_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_tank_ix ON event_log (tank_ix);
CREATE INDEX IF NOT EXISTS idx_temperature_samples_timestamp ON temperature_samples (tank_ix, timestamp DESC);

