"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetDataContext = exports.getDataContext = void 0;
const inMemory_1 = require("./providers/inMemory");
let context;
const getDataContext = () => {
    if (!context) {
        context = (0, inMemory_1.createInMemoryDataContext)();
    }
    return context;
};
exports.getDataContext = getDataContext;
const resetDataContext = () => {
    context = (0, inMemory_1.createInMemoryDataContext)();
};
exports.resetDataContext = resetDataContext;
//# sourceMappingURL=dataContext.js.map