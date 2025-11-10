"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modeRepository = void 0;
const dataContext_1 = require("../data/dataContext");
const ctx = () => (0, dataContext_1.getDataContext)();
exports.modeRepository = {
    get: (cuverieId) => ctx().generalModes.get(cuverieId),
    set: (cuverieId, mode) => ctx().generalModes.set(cuverieId, mode),
};
//# sourceMappingURL=modeRepository.js.map