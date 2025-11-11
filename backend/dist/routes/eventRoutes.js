"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const eventRepository_1 = require("../repositories/eventRepository");
const dataContext_1 = require("../data/dataContext");
const querySchema = zod_1.z.object({
    limit: zod_1.z
        .string()
        .optional()
        .transform((value) => (value ? Number(value) : undefined))
        .pipe(zod_1.z.number().int().positive().max(500).optional()),
});
exports.eventRoutes = (0, express_1.Router)();
exports.eventRoutes.get('/', async (req, res) => {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Paramètres invalides', details: parsed.error.flatten().fieldErrors });
    }
    const limit = parsed.data.limit ?? 100;
    if (dataContext_1.postgresAdapters) {
        try {
            const events = await dataContext_1.postgresAdapters.events.list(limit);
            return res.json({ data: events });
        }
        catch (error) {
            console.error('[Events] Lecture Postgres impossible', error);
        }
    }
    const events = eventRepository_1.eventRepository.list(limit);
    res.json({ data: events });
});
//# sourceMappingURL=eventRoutes.js.map