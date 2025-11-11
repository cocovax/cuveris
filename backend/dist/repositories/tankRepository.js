"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tankRepository = void 0;
const dataContext_1 = require("../data/dataContext");
const eventRepository_1 = require("./eventRepository");
const ctx = () => (0, dataContext_1.getDataContext)();
const updateTank = (id, updater) => {
    return ctx().tanks.update(id, (tank) => {
        const updated = updater(tank);
        return {
            ...updated,
            history: ctx().temperatureHistory.list(id, 48),
        };
    });
};
const createTankFromConfig = (cuverieId, config) => ({
    id: config.id,
    name: config.displayName,
    status: 'idle',
    temperature: 20,
    setpoint: 20,
    capacityLiters: 5000,
    fillLevelPercent: 50,
    isRunning: false,
    lastUpdatedAt: new Date().toISOString(),
    history: [],
    alarms: [],
    cuverieId,
});
exports.tankRepository = {
    list: () => ctx().tanks.list(),
    getById: (id) => ctx().tanks.getById(id),
    upsertFromConfig: (cuverieId, config) => {
        const existing = ctx().tanks.getById(config.id);
        if (!existing) {
            const created = createTankFromConfig(cuverieId, config);
            ctx().tanks.create(created);
            return created;
        }
        return ctx().tanks.update(config.id, (tank) => ({
            ...tank,
            name: config.displayName,
            cuverieId,
        }));
    },
    removeMissing: (cuverieId, configs) => {
        const ids = new Set(configs.map((tank) => tank.id));
        ctx()
            .tanks.list()
            .filter((tank) => tank.cuverieId === cuverieId && !ids.has(tank.id))
            .forEach((tank) => {
            ctx().tanks.update(tank.id, () => ({
                ...tank,
                status: 'offline',
            }));
        });
    },
    updateSetpoint: (id, setpoint) => updateTank(id, (tank) => {
        eventRepository_1.eventRepository.append({
            id: `cmd-setpoint-${Date.now()}`,
            timestamp: new Date().toISOString(),
            tankId: id,
            category: 'command',
            source: 'user',
            summary: `Consigne mise à ${setpoint.toFixed(1)}°C`,
            metadata: { previous: tank.setpoint, next: setpoint },
        });
        return {
            ...tank,
            setpoint,
        };
    }),
    updateRunning: (id, isRunning) => updateTank(id, (tank) => {
        eventRepository_1.eventRepository.append({
            id: `cmd-running-${Date.now()}`,
            timestamp: new Date().toISOString(),
            tankId: id,
            category: 'command',
            source: 'user',
            summary: isRunning ? 'Cuve démarrée' : 'Cuve arrêtée',
        });
        return {
            ...tank,
            isRunning,
            status: isRunning ? 'cooling' : 'idle',
        };
    }),
    updateContents: (id, contents) => updateTank(id, (tank) => {
        eventRepository_1.eventRepository.append({
            id: `cmd-contents-${Date.now()}`,
            timestamp: new Date().toISOString(),
            tankId: id,
            category: 'command',
            source: 'user',
            summary: 'Contenu mis à jour',
            metadata: { ...contents },
        });
        return {
            ...tank,
            contents,
        };
    }),
    applyTelemetry: (id, payload) => {
        if (payload.temperature !== undefined) {
            const sample = {
                timestamp: new Date().toISOString(),
                value: payload.temperature,
            };
            ctx().temperatureHistory.append(id, sample);
            if (dataContext_1.postgresAdapters) {
                void dataContext_1.postgresAdapters.temperatureHistory
                    .append(id, sample)
                    .catch((error) => console.error('[PostgresSync] Historique MQTT échoué', error));
            }
            eventRepository_1.eventRepository.append({
                id: `telemetry-${Date.now()}`,
                timestamp: sample.timestamp,
                tankId: id,
                category: 'telemetry',
                source: 'backend',
                summary: `Télémetrie ${sample.value.toFixed(1)}°C`,
            });
        }
        return updateTank(id, (tank) => ({
            ...tank,
            ...payload,
            history: ctx().temperatureHistory.list(id, 48),
        }));
    },
};
//# sourceMappingURL=tankRepository.js.map