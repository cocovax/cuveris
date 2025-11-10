"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuverieRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const modeRepository_1 = require("../repositories/modeRepository");
const configRepository_1 = require("../repositories/configRepository");
const mqttGateway_1 = require("../services/mqttGateway");
const eventRepository_1 = require("../repositories/eventRepository");
const modeSchema = zod_1.z.object({
    mode: zod_1.z.enum(['CHAUD', 'FROID', 'ARRET']),
});
exports.cuverieRoutes = (0, express_1.Router)();
exports.cuverieRoutes.post('/:id/mode', (req, res) => {
    const parsed = modeSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    const cuverie = configRepository_1.configRepository.list().find((entry) => entry.id === req.params.id);
    if (!cuverie) {
        return res.status(404).json({ error: 'Cuverie introuvable' });
    }
    modeRepository_1.modeRepository.set(cuverie.id, parsed.data.mode);
    mqttGateway_1.mqttGateway.publishGeneralMode(cuverie.name, parsed.data.mode);
    eventRepository_1.eventRepository.append({
        id: `mode-${cuverie.id}-${Date.now()}`,
        timestamp: new Date().toISOString(),
        category: 'command',
        source: 'user',
        summary: `Mode général ${parsed.data.mode} appliqué à ${cuverie.name}`,
        metadata: { cuverieId: cuverie.id },
    });
    res.json({ data: { id: cuverie.id, mode: parsed.data.mode } });
});
//# sourceMappingURL=cuverieRoutes.js.map