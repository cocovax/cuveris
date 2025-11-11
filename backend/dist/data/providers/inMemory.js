"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInMemoryDataContext = void 0;
const env_1 = require("../../config/env");
const now = () => new Date().toISOString();
const cloneTank = (tank, history) => ({
    ...tank,
    history: [...history],
});
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
const seedTanks = [
    {
        ix: 101,
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
        history: [],
        alarms: [],
        cuverieId: 'default',
        isDeleted: false,
    },
    {
        ix: 102,
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
        history: [],
        alarms: [],
        cuverieId: 'default',
        isDeleted: false,
    },
    {
        ix: 103,
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
        history: [],
        alarms: ['Température haute'],
        cuverieId: 'default',
        isDeleted: false,
    },
];
const seedAlarms = [
    {
        id: 'alarm-001',
        tankIx: 103,
        severity: 'critical',
        message: 'Température supérieure au seuil haut (+2.9°C)',
        triggeredAt: new Date(Date.now() - 1_800_000).toISOString(),
        acknowledged: false,
    },
];
const initialMqtt = {
    reconnectPeriod: env_1.env.mqtt.reconnectPeriod,
    enableMock: env_1.env.mqtt.enableMock,
};
if (env_1.env.mqtt.url) {
    initialMqtt.url = env_1.env.mqtt.url;
}
if (env_1.env.mqtt.username) {
    initialMqtt.username = env_1.env.mqtt.username;
}
if (env_1.env.mqtt.password) {
    initialMqtt.password = env_1.env.mqtt.password;
}
const seedSettings = {
    alarmThresholds: {
        high: 26,
        low: 16,
    },
    preferences: {
        locale: 'fr-FR',
        temperatureUnit: 'C',
        theme: 'auto',
    },
    mqtt: initialMqtt,
};
const tanksMap = new Map();
const historyMap = new Map();
const alarmsList = [];
let storedSettings = structuredClone(seedSettings);
const eventLog = [];
const cuveries = new Map();
const generalModes = new Map();
const initialise = () => {
    seedTanks.forEach((tank) => {
        const history = generateHistory(tank.temperature - 1, tank.temperature + 1.5);
        historyMap.set(tank.ix, history);
        tanksMap.set(tank.ix, { ...tank, history: [] });
    });
    seedAlarms.forEach((alarm) => alarmsList.push({ ...alarm }));
    const defaultCuverie = {
        id: 'default',
        name: 'Cuverie',
        tanks: seedTanks.map((tank, index) => ({
            id: tank.id,
            ix: 100 + index,
            displayName: tank.name,
            order: index,
        })),
    };
    cuveries.set(defaultCuverie.id, defaultCuverie);
    generalModes.set(defaultCuverie.id, 'ARRET');
};
initialise();
const buildTankStore = () => ({
    list: () => Array.from(tanksMap.values()).map((tank) => cloneTank(tank, historyMap.get(tank.ix) ?? [])),
    getByIx: (ix) => {
        const tank = tanksMap.get(ix);
        if (!tank)
            return undefined;
        const history = historyMap.get(ix) ?? [];
        return cloneTank(tank, history);
    },
    update: (ix, updater) => {
        const current = tanksMap.get(ix);
        if (!current)
            return undefined;
        const history = historyMap.get(ix) ?? [];
        const candidate = cloneTank(current, history);
        const updated = updater(candidate);
        historyMap.set(ix, [...updated.history]);
        const stored = {
            ...updated,
            history: [],
            lastUpdatedAt: now(),
        };
        tanksMap.set(ix, stored);
        return cloneTank(stored, historyMap.get(ix) ?? []);
    },
    create: (tank) => {
        tanksMap.set(tank.ix, { ...tank, history: [] });
        historyMap.set(tank.ix, [...tank.history]);
        return cloneTank(tank, tank.history);
    },
});
const buildAlarmStore = () => ({
    list: () => alarmsList.map((alarm) => ({ ...alarm })),
    add: (alarm) => {
        const stored = { ...alarm };
        alarmsList.unshift(stored);
        return { ...stored };
    },
    update: (id, updater) => {
        const index = alarmsList.findIndex((alarm) => alarm.id === id);
        if (index === -1)
            return undefined;
        const current = { ...alarmsList[index] };
        const updated = updater(current);
        alarmsList[index] = updated;
        return { ...updated };
    },
});
const buildSettingsStore = () => ({
    get: () => structuredClone(storedSettings),
    update: (payload) => {
        storedSettings = {
            ...storedSettings,
            ...payload,
            alarmThresholds: {
                ...storedSettings.alarmThresholds,
                ...(payload.alarmThresholds ?? {}),
            },
            preferences: {
                ...storedSettings.preferences,
                ...(payload.preferences ?? {}),
            },
            mqtt: {
                ...storedSettings.mqtt,
                ...(payload.mqtt ?? {}),
            },
        };
        return structuredClone(storedSettings);
    },
});
const buildHistoryStore = () => ({
    list: (tankIx, limit) => {
        const history = historyMap.get(tankIx) ?? [];
        if (history.length <= limit)
            return [...history];
        return history.slice(history.length - limit);
    },
    append: (tankIx, sample) => {
        const history = historyMap.get(tankIx) ?? [];
        history.push(sample);
        historyMap.set(tankIx, history.slice(-48));
        const tank = tanksMap.get(tankIx);
        if (tank) {
            tanksMap.set(tankIx, { ...tank, lastUpdatedAt: sample.timestamp });
        }
    },
});
const buildEventLogStore = () => ({
    list: (limit) => eventLog.slice(0, limit).map((entry) => ({ ...entry })),
    append: (entry) => {
        eventLog.unshift({ ...entry });
        if (eventLog.length > 500) {
            eventLog.splice(500);
        }
    },
});
const buildCuverieStore = () => ({
    list: () => Array.from(cuveries.values()).map((cuverie) => ({
        ...cuverie,
        tanks: cuverie.tanks.map((tank) => ({ ...tank })),
    })),
    upsert: (cuverie) => {
        cuveries.set(cuverie.id, {
            ...cuverie,
            tanks: cuverie.tanks.map((tank) => ({ ...tank })),
        });
    },
    deleteById: (id) => {
        cuveries.delete(id);
    },
});
const buildGeneralModeStore = () => ({
    get: (cuverieId) => generalModes.get(cuverieId),
    set: (cuverieId, mode) => {
        generalModes.set(cuverieId, mode);
    },
});
const createInMemoryDataContext = () => ({
    tanks: buildTankStore(),
    alarms: buildAlarmStore(),
    settings: buildSettingsStore(),
    temperatureHistory: buildHistoryStore(),
    events: buildEventLogStore(),
    cuveries: buildCuverieStore(),
    generalModes: buildGeneralModeStore(),
});
exports.createInMemoryDataContext = createInMemoryDataContext;
//# sourceMappingURL=inMemory.js.map