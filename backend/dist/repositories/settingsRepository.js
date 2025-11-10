"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRepository = void 0;
const dataContext_1 = require("../data/dataContext");
exports.settingsRepository = {
    get: () => (0, dataContext_1.getDataContext)().settings.get(),
    update: (payload) => (0, dataContext_1.getDataContext)().settings.update(payload),
};
//# sourceMappingURL=settingsRepository.js.map