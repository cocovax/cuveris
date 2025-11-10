"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alarmRepository = void 0;
const dataContext_1 = require("../data/dataContext");
exports.alarmRepository = {
    list: () => (0, dataContext_1.getDataContext)().alarms.list(),
    add: (alarm) => (0, dataContext_1.getDataContext)().alarms.add(alarm),
    acknowledge: (id) => (0, dataContext_1.getDataContext)().alarms.update(id, (alarm) => ({ ...alarm, acknowledged: true })),
};
//# sourceMappingURL=alarmRepository.js.map