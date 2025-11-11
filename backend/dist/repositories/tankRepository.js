"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tankRepository = void 0;
const dataContext_1 = require("../data/dataContext");
const eventRepository_1 = require("./eventRepository");
const ctx = () => (0, dataContext_1.getDataContext)();
const updateTank = (ix, updater) => {
    const existing = ctx().tanks.getByIx(ix);
    if (!existing || existing.isDeleted) {
        return undefined;
    }
    return ctx().tanks.update(ix, (tank) => {
        if (tank.isDeleted) {
            return tank;
        }
        const updated = updater(tank);
        return {
            ...updated,
            history: ctx().temperatureHistory.list(ix, 48),
        };
    });
};
const createTankFromConfig = (cuverieId, config) => ({
    ix: config.ix,
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
    isDeleted: false,
});
exports.tankRepository = {
    list: () => ctx().tanks.list().filter((tank) => !tank.isDeleted),
    getByIx: (ix) => {
        const tank = ctx().tanks.getByIx(ix);
        return tank && !tank.isDeleted ? tank : undefined;
    },
    upsertFromConfig: (cuverieId, config) => {
        const existing = ctx().tanks.getByIx(config.ix);
        if (!existing) {
            const created = createTankFromConfig(cuverieId, config);
            ctx().tanks.create(created);
            return created;
        }
        return ctx().tanks.update(config.ix, (tank) => ({
            ...tank,
            name: config.displayName,
            cuverieId,
            isDeleted: false,
        }));
    },
    removeMissing: (cuverieId, configs) => {
        const ixSet = new Set(configs.map((tank) => tank.ix));
        ctx()
            .tanks.list()
            .filter((tank) => tank.cuverieId === cuverieId && !ixSet.has(tank.ix))
            .forEach((tank) => {
            ctx().tanks.update(tank.ix, () => ({
                ...tank,
                status: 'offline',
                isDeleted: true,
            }));
        });
    },
    updateSetpoint: (ix, setpoint) => updateTank(ix, (tank) => {
        eventRepository_1.eventRepository.append({
            id: `cmd-setpoint-${Date.now()}`,
            timestamp: new Date().toISOString(),
            tankIx: tank.ix,
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
    updateRunning: (ix, isRunning) => updateTank(ix, (tank) => {
        eventRepository_1.eventRepository.append({
            id: `cmd-running-${Date.now()}`,
            timestamp: new Date().toISOString(),
            tankIx: tank.ix,
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
    updateContents: (ix, contents) => updateTank(ix, (tank) => {
        eventRepository_1.eventRepository.append({
            id: `cmd-contents-${Date.now()}`,
            timestamp: new Date().toISOString(),
            tankIx: tank.ix,
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
    applyTelemetry: (ix, payload) => {
        const current = ctx().tanks.getByIx(ix);
        if (!current || current.isDeleted) {
            return undefined;
        }
        if (payload.temperature !== undefined) {
            const sample = {
                timestamp: new Date().toISOString(),
                value: payload.temperature,
            };
            ctx().temperatureHistory.append(ix, sample);
            if (dataContext_1.postgresAdapters) {
                void dataContext_1.postgresAdapters.temperatureHistory
                    .append(ix, sample)
                    .catch((error) => console.error('[PostgresSync] Historique MQTT échoué', error));
            }
            eventRepository_1.eventRepository.append({
                id: `telemetry-${Date.now()}`,
                timestamp: sample.timestamp,
                tankIx: current.ix,
                category: 'telemetry',
                source: 'backend',
                summary: `Télémetrie ${sample.value.toFixed(1)}°C`,
            });
        }
        return updateTank(ix, (tank) => ({
            ...tank,
            ...payload,
            history: ctx().temperatureHistory.list(ix, 48),
            isDeleted: false,
        }));
    },
};
//# sourceMappingURL=tankRepository.js.map