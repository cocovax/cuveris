"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRepository = void 0;
const dataContext_1 = require("../data/dataContext");
const eventBus_1 = require("../services/eventBus");
const ctx = () => (0, dataContext_1.getDataContext)();
exports.eventRepository = {
    list: (limit = 100) => ctx().events.list(limit),
    append: (event) => {
        ctx().events.append(event);
        eventBus_1.eventBus.emit(event);
    },
};
//# sourceMappingURL=eventRepository.js.map