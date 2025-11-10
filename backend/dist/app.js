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
const authRoutes_1 = require("./routes/authRoutes");
const eventRoutes_1 = require("./routes/eventRoutes");
const configRoutes_1 = require("./routes/configRoutes");
const cuverieRoutes_1 = require("./routes/cuverieRoutes");
const authMiddleware_1 = require("./middleware/authMiddleware");
const env_1 = require("./config/env");
const mqttGateway_1 = require("./services/mqttGateway");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: env_1.env.nodeEnv === 'development' ? '*' : undefined,
        allowedHeaders: ['Content-Type', 'Authorization'],
    }));
    app.use(express_1.default.json());
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', mode: env_1.env.nodeEnv, mqttMode: mqttGateway_1.mqttGateway.getMode() });
    });
    app.use('/api/auth', authRoutes_1.authRoutes);
    app.use('/api/tanks', authMiddleware_1.authenticate, tankRoutes_1.tankRoutes);
    app.use('/api/alarms', authMiddleware_1.authenticate, alarmRoutes_1.alarmRoutes);
    app.use('/api/settings', authMiddleware_1.authenticate, settingsRoutes_1.settingsRoutes);
    app.use('/api/mqtt', authMiddleware_1.authenticate, mqttRoutes_1.mqttRoutes);
    app.use('/api/events', authMiddleware_1.authenticate, eventRoutes_1.eventRoutes);
    app.use('/api/config', authMiddleware_1.authenticate, configRoutes_1.configRoutes);
    app.use('/api/cuveries', authMiddleware_1.authenticate, cuverieRoutes_1.cuverieRoutes);
    app.use((_req, res) => {
        res.status(404).json({ error: 'Route introuvable' });
    });
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map