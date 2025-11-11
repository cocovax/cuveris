"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPostgresSync = void 0;
const dataContext_1 = require("../data/dataContext");
const eventBus_1 = require("../services/eventBus");
const initPostgresSync = () => {
    if (!dataContext_1.postgresAdapters) {
        return () => undefined;
    }
    const unsubscribeEvents = eventBus_1.eventBus.subscribe(async (event) => {
        try {
            await dataContext_1.postgresAdapters?.events.append(event);
        }
        catch (error) {
            console.error('[PostgresSync] Impossible de persister l’événement', error);
        }
    });
    return () => {
        unsubscribeEvents();
    };
};
exports.initPostgresSync = initPostgresSync;
//# sourceMappingURL=postgresSync.js.map