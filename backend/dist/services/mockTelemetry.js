"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopMockTelemetry = exports.startMockTelemetry = void 0;
const DEFAULT_TANKS = [101, 102, 103];
let timer;
const startMockTelemetry = (emit, options = {}) => {
    (0, exports.stopMockTelemetry)();
    const intervalMs = options.intervalMs ?? 5000;
    const tankList = options.tankIxs && options.tankIxs.length > 0 ? options.tankIxs : DEFAULT_TANKS;
    timer = setInterval(() => {
        const index = Math.floor(Math.random() * tankList.length);
        const candidate = tankList[index];
        const tankIx = candidate ?? DEFAULT_TANKS[0];
        const base = 20 + Math.random() * 5;
        const temperature = Number((base + (Math.random() - 0.5)).toFixed(2));
        emit({
            ix: tankIx,
            temperature,
            lastUpdatedAt: new Date().toISOString(),
        });
    }, intervalMs);
};
exports.startMockTelemetry = startMockTelemetry;
const stopMockTelemetry = () => {
    if (timer) {
        clearInterval(timer);
        timer = undefined;
    }
};
exports.stopMockTelemetry = stopMockTelemetry;
//# sourceMappingURL=mockTelemetry.js.map