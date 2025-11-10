"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRoutes = void 0;
const express_1 = require("express");
const configRepository_1 = require("../repositories/configRepository");
const modeRepository_1 = require("../repositories/modeRepository");
exports.configRoutes = (0, express_1.Router)();
exports.configRoutes.get('/', (_req, res) => {
    const cuveries = configRepository_1.configRepository.list().map((cuverie) => ({
        ...cuverie,
        mode: modeRepository_1.modeRepository.get(cuverie.id) ?? 'ARRET',
    }));
    res.json({ data: cuveries });
});
//# sourceMappingURL=configRoutes.js.map