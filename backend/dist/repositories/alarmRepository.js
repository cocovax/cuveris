"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alarmRepository = void 0;
const dataContext_1 = require("../data/dataContext");
const eventRepository_1 = require("./eventRepository");
exports.alarmRepository = {
    list: () => (0, dataContext_1.getDataContext)().alarms.list(),
    add: (alarm) => {
        eventRepository_1.eventRepository.append({
            id: `alarm-${alarm.id}`,
            timestamp: alarm.triggeredAt,
            tankIx: alarm.tankIx,
            category: 'alarm',
            source: 'system',
            summary: alarm.message,
            metadata: { severity: alarm.severity },
        });
        return (0, dataContext_1.getDataContext)().alarms.add(alarm);
    },
    acknowledge: (id) => (0, dataContext_1.getDataContext)().alarms.update(id, (alarm) => {
        eventRepository_1.eventRepository.append({
            id: `alarm-ack-${id}-${Date.now()}`,
            timestamp: new Date().toISOString(),
            tankIx: alarm.tankIx,
            category: 'alarm',
            source: 'user',
            summary: `Alarme acquittée : ${alarm.message}`,
        });
        return { ...alarm, acknowledged: true };
    }),
};
//# sourceMappingURL=alarmRepository.js.map