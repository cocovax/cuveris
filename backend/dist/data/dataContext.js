"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDataContext = exports.getDataContext = exports.postgresAdapters = void 0;
const inMemory_1 = require("./providers/inMemory");
const postgres_1 = require("./providers/postgres");
const env_1 = require("../config/env");
let context;
const initializeContext = () => {
    context = (0, inMemory_1.createInMemoryDataContext)();
    if (env_1.env.data.provider === 'postgres' && env_1.env.data.databaseUrl) {
        try {
            const config = {
                eventConnectionString: env_1.env.data.databaseUrl,
                statementTimeoutMs: 5000,
            };
            if (env_1.env.data.timeseriesUrl) {
                config.timeseriesConnectionString = env_1.env.data.timeseriesUrl;
            }
            exports.postgresAdapters = (0, postgres_1.createPostgresAdapters)(config);
            console.info('[Data] Adaptateur PostgreSQL initialisé');
        }
        catch (error) {
            console.error('[Data] Impossible d’initialiser l’adaptateur PostgreSQL', error);
            exports.postgresAdapters = undefined;
        }
    }
    return context;
};
const getDataContext = () => {
    if (!context) {
        return initializeContext();
    }
    return context;
};
exports.getDataContext = getDataContext;
const resetDataContext = () => {
    initializeContext();
};
exports.resetDataContext = resetDataContext;
//# sourceMappingURL=dataContext.js.map