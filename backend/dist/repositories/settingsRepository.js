"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRepository = void 0;
const inMemoryStore_1 = require("./inMemoryStore");
exports.settingsRepository = {
    get: () => inMemoryStore_1.inMemoryStore.settings,
    update: (payload) => {
        inMemoryStore_1.inMemoryStore.settings = {
            ...inMemoryStore_1.inMemoryStore.settings,
            ...payload,
            alarmThresholds: {
                ...inMemoryStore_1.inMemoryStore.settings.alarmThresholds,
                ...(payload.alarmThresholds ?? {}),
            },
            preferences: {
                ...inMemoryStore_1.inMemoryStore.settings.preferences,
                ...(payload.preferences ?? {}),
            },
        };
        return inMemoryStore_1.inMemoryStore.settings;
    },
};
//# sourceMappingURL=settingsRepository.js.map