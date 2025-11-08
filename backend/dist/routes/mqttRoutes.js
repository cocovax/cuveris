"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const mqttGateway_1 = require("../services/mqttGateway");
const modeSchema = zod_1.z.object({
    mode: zod_1.z.enum(['mock', 'live']),
});
exports.mqttRoutes = (0, express_1.Router)();
exports.mqttRoutes.get('/', (_req, res) => {
    res.json({ data: { mode: mqttGateway_1.mqttGateway.getMode() } });
});
exports.mqttRoutes.post('/mode', (req, res) => {
    const parsed = modeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    mqttGateway_1.mqttGateway.switchMode(parsed.data.mode);
    res.json({ data: { mode: mqttGateway_1.mqttGateway.getMode() } });
});
//# sourceMappingURL=mqttRoutes.js.map