"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const settingsRepository_1 = require("../repositories/settingsRepository");
const settingsSchema = zod_1.z.object({
    alarmThresholds: zod_1.z
        .object({
        high: zod_1.z.number().min(-10).max(80),
        low: zod_1.z.number().min(-10).max(80),
    })
        .partial()
        .optional(),
    preferences: zod_1.z
        .object({
        locale: zod_1.z.string(),
        temperatureUnit: zod_1.z.enum(['C', 'F']),
        theme: zod_1.z.enum(['light', 'dark', 'auto']),
    })
        .partial()
        .optional(),
});
exports.settingsRoutes = (0, express_1.Router)();
exports.settingsRoutes.get('/', (_req, res) => {
    res.json({ data: settingsRepository_1.settingsRepository.get() });
});
exports.settingsRoutes.patch('/', (req, res) => {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Payload invalide', details: parsed.error.flatten().fieldErrors });
    }
    const current = settingsRepository_1.settingsRepository.get();
    const payload = {};
    if (parsed.data.alarmThresholds) {
        const thresholds = { ...current.alarmThresholds };
        if (parsed.data.alarmThresholds.high !== undefined) {
            thresholds.high = parsed.data.alarmThresholds.high;
        }
        if (parsed.data.alarmThresholds.low !== undefined) {
            thresholds.low = parsed.data.alarmThresholds.low;
        }
        payload.alarmThresholds = thresholds;
    }
    if (parsed.data.preferences) {
        const preferences = { ...current.preferences };
        if (parsed.data.preferences.locale !== undefined) {
            preferences.locale = parsed.data.preferences.locale;
        }
        if (parsed.data.preferences.temperatureUnit !== undefined) {
            preferences.temperatureUnit = parsed.data.preferences.temperatureUnit;
        }
        if (parsed.data.preferences.theme !== undefined) {
            preferences.theme = parsed.data.preferences.theme;
        }
        payload.preferences = preferences;
    }
    const updated = settingsRepository_1.settingsRepository.update(payload);
    res.json({ data: updated });
});
//# sourceMappingURL=settingsRoutes.js.map