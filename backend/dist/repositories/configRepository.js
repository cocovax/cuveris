"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRepository = void 0;
const dataContext_1 = require("../data/dataContext");
const ctx = () => (0, dataContext_1.getDataContext)();
exports.configRepository = {
    list: () => ctx().cuveries.list(),
    upsert: (cuverie) => ctx().cuveries.upsert(cuverie),
    deleteById: (id) => ctx().cuveries.deleteById(id),
};
//# sourceMappingURL=configRepository.js.map