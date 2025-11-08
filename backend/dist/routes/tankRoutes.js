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
exports.tankRoutes.get('/:id', (req, res) => {
    const tank = tankRepository_1.tankRepository.getById(req.params.id);
    if (!tank) {
        return res.status(404).json({ error: 'Cuve introuvable' });
    }
    return res.json({ data: tank });
});
exports.tankRoutes.post('/:id/setpoint', (req, res) => {
    const parsed = setpointSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    const updated = tankRepository_1.tankRepository.updateSetpoint(req.params.id, parsed.data.value);
    if (!updated)
        return res.status(404).json({ error: 'Cuve introuvable' });
    mqttGateway_1.mqttGateway.publishCommand(req.params.id, { type: 'setpoint', value: parsed.data.value });
    return res.json({ data: updated });
});
exports.tankRoutes.post('/:id/running', (req, res) => {
    const parsed = runningSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    const updated = tankRepository_1.tankRepository.updateRunning(req.params.id, parsed.data.value);
    if (!updated)
        return res.status(404).json({ error: 'Cuve introuvable' });
    mqttGateway_1.mqttGateway.publishCommand(req.params.id, { type: 'running', value: parsed.data.value });
    return res.json({ data: updated });
});
exports.tankRoutes.post('/:id/contents', (req, res) => {
    const parsed = contentsSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    const { notes, ...rest } = parsed.data;
    const contents = notes === undefined ? { ...rest } : { ...rest, notes };
    const updated = tankRepository_1.tankRepository.updateContents(req.params.id, contents);
    if (!updated)
        return res.status(404).json({ error: 'Cuve introuvable' });
    mqttGateway_1.mqttGateway.publishCommand(req.params.id, { type: 'contents', value: contents });
    return res.json({ data: updated });
});
//# sourceMappingURL=tankRoutes.js.map