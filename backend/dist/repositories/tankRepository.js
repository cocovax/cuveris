"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tankRepository = void 0;
const inMemoryStore_1 = require("./inMemoryStore");
const updateTank = (id, updater) => {
    const index = inMemoryStore_1.inMemoryStore.tanks.findIndex((tank) => tank.id === id);
    if (index === -1)
        return undefined;
    const current = inMemoryStore_1.inMemoryStore.tanks[index];
    if (!current)
        return undefined;
    const updated = updater({ ...current });
    inMemoryStore_1.inMemoryStore.tanks[index] = { ...updated, lastUpdatedAt: new Date().toISOString() };
    return inMemoryStore_1.inMemoryStore.tanks[index];
};
exports.tankRepository = {
    list: () => inMemoryStore_1.inMemoryStore.tanks,
    getById: (id) => inMemoryStore_1.inMemoryStore.tanks.find((tank) => tank.id === id),
    updateSetpoint: (id, setpoint) => updateTank(id, (tank) => ({
        ...tank,
        setpoint,
    })),
    updateRunning: (id, isRunning) => updateTank(id, (tank) => ({
        ...tank,
        isRunning,
        status: isRunning ? 'cooling' : 'idle',
    })),
    updateContents: (id, contents) => updateTank(id, (tank) => ({
        ...tank,
        contents,
    })),
    applyTelemetry: (id, payload) => updateTank(id, (tank) => ({
        ...tank,
        ...payload,
        history: payload.temperature !== undefined
            ? [
                ...tank.history.slice(-47),
                { timestamp: new Date().toISOString(), value: payload.temperature },
            ]
            : tank.history,
    })),
};
//# sourceMappingURL=tankRepository.js.map