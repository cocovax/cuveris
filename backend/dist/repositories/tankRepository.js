"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tankRepository = void 0;
const dataContext_1 = require("../data/dataContext");
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
exports.tankRepository = {
    list: () => ctx().tanks.list(),
    getById: (id) => ctx().tanks.getById(id),
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
    applyTelemetry: (id, payload) => {
        if (payload.temperature !== undefined) {
            const sample = {
                timestamp: new Date().toISOString(),
                value: payload.temperature,
            };
            ctx().temperatureHistory.append(id, sample);
        }
        return updateTank(id, (tank) => ({
            ...tank,
            ...payload,
            history: ctx().temperatureHistory.list(id, 48),
        }));
    },
};
//# sourceMappingURL=tankRepository.js.map