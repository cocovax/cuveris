"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alarmRepository = void 0;
const inMemoryStore_1 = require("./inMemoryStore");
exports.alarmRepository = {
    list: () => inMemoryStore_1.inMemoryStore.alarms,
    add: (alarm) => {
        inMemoryStore_1.inMemoryStore.alarms.unshift(alarm);
        return alarm;
    },
    acknowledge: (id) => {
        const alarm = inMemoryStore_1.inMemoryStore.alarms.find((item) => item.id === id);
        if (!alarm)
            return undefined;
        alarm.acknowledged = true;
        return alarm;
    },
};
//# sourceMappingURL=alarmRepository.js.map