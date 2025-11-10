"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
const node_events_1 = require("node:events");
const bus = new node_events_1.EventEmitter();
exports.eventBus = {
    emit: (event) => {
        bus.emit('event', event);
    },
    subscribe: (listener) => {
        bus.on('event', listener);
        return () => bus.off('event', listener);
    },
};
//# sourceMappingURL=eventBus.js.map