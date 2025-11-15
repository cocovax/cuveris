"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tankRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const tankRepository_1 = require("../repositories/tankRepository");
const mqttGateway_1 = require("../services/mqttGateway");
const setpointSchema = zod_1.z.object({
    value: zod_1.z.number().min(-10).max(60),
});
const runningSchema = zod_1.z.object({
    value: zod_1.z.boolean(),
});
const contentsSchema = zod_1.z.object({
    grape: zod_1.z.string().min(1),
    vintage: zod_1.z.number().min(1900).max(2100),
    volumeLiters: zod_1.z.number().positive(),
    notes: zod_1.z.string().optional(),
});
exports.tankRoutes = (0, express_1.Router)();
exports.tankRoutes.get('/', (_req, res) => {
    res.json({ data: tankRepository_1.tankRepository.list() });
});
const parseIx = (value) => {
    const ix = Number(value);
    return Number.isFinite(ix) ? ix : undefined;
};
exports.tankRoutes.get('/:ix', (req, res) => {
    const ix = parseIx(req.params.ix);
    if (ix === undefined) {
        return res.status(400).json({ error: 'Identifiant de cuve invalide' });
    }
    const tank = tankRepository_1.tankRepository.getByIx(ix);
    if (!tank) {
        return res.status(404).json({ error: 'Cuve introuvable' });
    }
    return res.json({ data: tank });
});
exports.tankRoutes.post('/:ix/setpoint', (req, res) => {
    const ix = parseIx(req.params.ix);
    if (ix === undefined) {
        return res.status(400).json({ error: 'Identifiant de cuve invalide' });
    }
    const parsed = setpointSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    const updated = tankRepository_1.tankRepository.updateSetpoint(ix, parsed.data.value);
    if (!updated)
        return res.status(404).json({ error: 'Cuve introuvable' });
    mqttGateway_1.mqttGateway.publishCommand(ix, { type: 'setpoint', value: parsed.data.value });
    return res.json({ data: updated });
});
exports.tankRoutes.post('/:ix/running', (req, res) => {
    const ix = parseIx(req.params.ix);
    if (ix === undefined) {
        return res.status(400).json({ error: 'Identifiant de cuve invalide' });
    }
    const parsed = runningSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    const updated = tankRepository_1.tankRepository.updateRunning(ix, parsed.data.value);
    if (!updated)
        return res.status(404).json({ error: 'Cuve introuvable' });
    mqttGateway_1.mqttGateway.publishCommand(ix, { type: 'running', value: parsed.data.value });
    return res.json({ data: updated });
});
exports.tankRoutes.post('/:ix/contents', (req, res) => {
    const ix = parseIx(req.params.ix);
    if (ix === undefined) {
        return res.status(400).json({ error: 'Identifiant de cuve invalide' });
    }
    const parsed = contentsSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    const { notes, ...rest } = parsed.data;
    const contents = notes === undefined ? { ...rest } : { ...rest, notes };
    const updated = tankRepository_1.tankRepository.updateContents(ix, contents);
    if (!updated)
        return res.status(404).json({ error: 'Cuve introuvable' });
    // Publier uniquement l'affectation (grape) via MQTT, les autres infos restent en BDD
    mqttGateway_1.mqttGateway.publishCommand(ix, { type: 'contents', value: contents.grape });
    return res.json({ data: updated });
});
//# sourceMappingURL=tankRoutes.js.map