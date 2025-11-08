"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inMemoryStore = void 0;
const now = () => new Date().toISOString();
const generateHistory = (min, max, points = 48) => {
    const data = [];
    const current = Date.now();
    for (let i = points - 1; i >= 0; i -= 1) {
        const timestamp = new Date(current - i * 30 * 60 * 1000).toISOString();
        const value = Number((min + Math.random() * (max - min)).toFixed(2));
        data.push({ timestamp, value });
    }
    return data;
};
const tanks = [
    {
        id: 'tank-01',
        name: 'Cuve 01',
        status: 'cooling',
        temperature: 18.4,
        setpoint: 18.0,
        capacityLiters: 5000,
        fillLevelPercent: 72,
        contents: { grape: 'Chardonnay', vintage: 2024, volumeLiters: 3600 },
        isRunning: true,
        lastUpdatedAt: now(),
        history: generateHistory(18, 19.3),
        alarms: [],
    },
    {
        id: 'tank-02',
        name: 'Cuve 02',
        status: 'idle',
        temperature: 21.1,
        setpoint: 21.0,
        capacityLiters: 6000,
        fillLevelPercent: 55,
        contents: { grape: 'Sauvignon', vintage: 2023, volumeLiters: 3300 },
        isRunning: false,
        lastUpdatedAt: now(),
        history: generateHistory(20.5, 22),
        alarms: [],
    },
    {
        id: 'tank-03',
        name: 'Cuve 03',
        status: 'alarm',
        temperature: 25.9,
        setpoint: 23.0,
        capacityLiters: 4500,
        fillLevelPercent: 91,
        contents: { grape: 'Merlot', vintage: 2024, volumeLiters: 4095 },
        isRunning: true,
        lastUpdatedAt: now(),
        history: generateHistory(22.5, 26.2),
        alarms: ['Température haute'],
    },
];
const alarms = [
    {
        id: 'alarm-001',
        tankId: 'tank-03',
        severity: 'critical',
        message: 'Température supérieure au seuil haut (+2.9°C)',
        triggeredAt: new Date(Date.now() - 1_800_000).toISOString(),
        acknowledged: false,
    },
];
const settings = {
    alarmThresholds: {
        high: 26,
        low: 16,
    },
    preferences: {
        locale: 'fr-FR',
        temperatureUnit: 'C',
        theme: 'auto',
    },
};
exports.inMemoryStore = {
    tanks,
    alarms,
    settings,
};
//# sourceMappingURL=inMemoryStore.js.map