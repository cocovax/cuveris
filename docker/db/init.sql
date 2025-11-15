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

CREATE TABLE IF NOT EXISTS tanks (
    ix INTEGER PRIMARY KEY,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    temperature DOUBLE PRECISION NOT NULL,
    setpoint DOUBLE PRECISION NOT NULL,
    capacity_liters INTEGER NOT NULL,
    fill_level_percent INTEGER NOT NULL,
    contents JSONB,
    is_running BOOLEAN NOT NULL,
    last_updated_at TIMESTAMPTZ NOT NULL,
    cuverie_id TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_log_timestamp ON event_log (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_tank_ix ON event_log (tank_ix);
CREATE INDEX IF NOT EXISTS idx_temperature_samples_timestamp ON temperature_samples (tank_ix, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tanks_cuverie_id ON tanks (cuverie_id);
CREATE INDEX IF NOT EXISTS idx_tanks_is_deleted ON tanks (is_deleted);
CREATE INDEX IF NOT EXISTS idx_tanks_last_updated_at ON tanks (last_updated_at DESC);

