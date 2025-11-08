"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const tankRoutes_1 = require("./routes/tankRoutes");
const alarmRoutes_1 = require("./routes/alarmRoutes");
const settingsRoutes_1 = require("./routes/settingsRoutes");
const mqttRoutes_1 = require("./routes/mqttRoutes");
const env_1 = require("./config/env");
const mqttGateway_1 = require("./services/mqttGateway");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: env_1.env.nodeEnv === 'development' ? '*' : undefined,
    }));
    app.use(express_1.default.json());
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', mode: env_1.env.nodeEnv, mqttMode: mqttGateway_1.mqttGateway.getMode() });
    });
    app.use('/api/tanks', tankRoutes_1.tankRoutes);
    app.use('/api/alarms', alarmRoutes_1.alarmRoutes);
    app.use('/api/settings', settingsRoutes_1.settingsRoutes);
    app.use('/api/mqtt', mqttRoutes_1.mqttRoutes);
    app.use((_req, res) => {
        res.status(404).json({ error: 'Route introuvable' });
    });
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map