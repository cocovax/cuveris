"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alarmRoutes = void 0;
const express_1 = require("express");
const alarmRepository_1 = require("../repositories/alarmRepository");
exports.alarmRoutes = (0, express_1.Router)();
exports.alarmRoutes.get('/', (_req, res) => {
    res.json({ data: alarmRepository_1.alarmRepository.list() });
});
exports.alarmRoutes.post('/:id/acknowledge', (req, res) => {
    const alarm = alarmRepository_1.alarmRepository.acknowledge(req.params.id);
    if (!alarm)
        return res.status(404).json({ error: 'Alarme introuvable' });
    return res.json({ data: alarm });
});
//# sourceMappingURL=alarmRoutes.js.map