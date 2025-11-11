"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mqttGateway = void 0;
const mqtt_1 = __importDefault(require("mqtt"));
const node_events_1 = require("node:events");
const env_1 = require("../config/env");
const mockTelemetry_1 = require("./mockTelemetry");
const tankRepository_1 = require("../repositories/tankRepository");
const configRepository_1 = require("../repositories/configRepository");
const modeRepository_1 = require("../repositories/modeRepository");
const telemetryEmitter = new node_events_1.EventEmitter();
const configEmitter = new node_events_1.EventEmitter();
let client;
let mode = env_1.env.mqtt.enableMock || !env_1.env.mqtt.url ? 'mock' : 'live';
let started = false;
const CONFIG_TOPIC = 'global/config/cuves';
const CUVERIE_MODE_TOPIC = (cuverieName) => `global/prod/${cuverieName}/mode`;
const resolveTankIx = (identifier) => {
    if (typeof identifier === 'number' && Number.isFinite(identifier)) {
        return identifier;
    }
    if (typeof identifier === 'string') {
        const numeric = Number(identifier);
        if (!Number.isNaN(numeric)) {
            return numeric;
        }
        const tank = tankRepository_1.tankRepository.list().find((candidate) => candidate.id === identifier);
        if (tank) {
            return tank.ix;
        }
    }
    return undefined;
};
const emitTelemetry = (tankRef, payload, source) => {
    const tankIx = resolveTankIx(tankRef);
    if (tankIx === undefined)
        return;
    const updated = tankRepository_1.tankRepository.applyTelemetry(tankIx, payload);
    if (!updated)
        return;
    telemetryEmitter.emit('telemetry', { tank: updated, source });
};
const emitConfig = (cuveries) => {
    const enriched = cuveries.map((cuverie) => ({
        ...cuverie,
        mode: modeRepository_1.modeRepository.get(cuverie.id) ?? 'ARRET',
    }));
    configEmitter.emit('config', { cuveries: enriched });
};
const normalizeCuverieId = (name) => {
    if (!name || name.trim().length === 0 || name.toLowerCase() === 'default') {
        return 'default';
    }
    return name
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
};
const formatTankId = (cuverieId, baseId, fallbackName, index) => {
    const normalizedBase = Number.isFinite(baseId) ? baseId : index + 1;
    const padded = String(normalizedBase).padStart(2, '0');
    if (cuverieId === 'default') {
        return `tank-${padded}`;
    }
    return `${cuverieId}-tank-${padded}`;
};
const normalizeTankId = (cuverieId, tank, index) => {
    const base = tank.ID ?? tank.IX ?? index + 1;
    return formatTankId(cuverieId, base, tank.Nom ?? 'tank', index);
};
const parseCuverieMessage = (payload) => {
    const entries = Array.isArray(payload) ? payload : [payload];
    const cuveries = [];
    for (const entry of entries) {
        if (typeof entry !== 'object' || entry === null)
            continue;
        const { CUVERIE, CUVES } = entry;
        const cuverieName = CUVERIE ?? 'default';
        const cuverieId = normalizeCuverieId(cuverieName);
        const rawTanks = Array.isArray(CUVES) ? CUVES : [];
        const tanks = rawTanks
            .map((tank, index) => {
            if (typeof tank !== 'object' || tank === null)
                return undefined;
            const typed = tank;
            return {
                id: normalizeTankId(cuverieId, typed, index),
                ix: typed.IX ?? typed.ID ?? index,
                displayName: typed.Nom ?? `Cuve ${index + 1}`,
                order: typed.ID ?? index,
            };
        })
            .filter((tank) => Boolean(tank));
        cuveries.push({
            id: cuverieId,
            name: cuverieName,
            tanks,
        });
    }
    return cuveries;
};
const syncConfig = (cuveries) => {
    const existing = new Set(configRepository_1.configRepository.list().map((cuverie) => cuverie.id));
    const seen = new Set();
    cuveries.forEach((cuverie) => {
        configRepository_1.configRepository.upsert(cuverie);
        cuverie.tanks.forEach((tank) => tankRepository_1.tankRepository.upsertFromConfig(cuverie.id, tank));
        tankRepository_1.tankRepository.removeMissing(cuverie.id, cuverie.tanks);
        if (!modeRepository_1.modeRepository.get(cuverie.id)) {
            modeRepository_1.modeRepository.set(cuverie.id, 'ARRET');
        }
        seen.add(cuverie.id);
    });
    existing.forEach((id) => {
        if (!seen.has(id)) {
            configRepository_1.configRepository.deleteById(id);
        }
    });
    emitConfig(configRepository_1.configRepository.list());
};
const handleConfigMessage = (raw) => {
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const cuveries = parseCuverieMessage(parsed);
        if (cuveries.length > 0) {
            syncConfig(cuveries);
        }
    }
    catch (error) {
        console.error('[MQTT] Configuration cuverie invalide', error);
    }
};
const handleModeMessage = (topic, message) => {
    const segments = topic.split('/');
    const cuverieName = segments[2];
    if (!cuverieName)
        return;
    const cuverieId = normalizeCuverieId(cuverieName);
    const modeValue = message.trim().toUpperCase();
    if (!['CHAUD', 'FROID', 'ARRET'].includes(modeValue))
        return;
    modeRepository_1.modeRepository.set(cuverieId, modeValue);
    emitConfig(configRepository_1.configRepository.list());
};
const startMock = () => {
    (0, mockTelemetry_1.stopMockTelemetry)();
    mode = 'mock';
    const tankIxs = tankRepository_1.tankRepository.list().map((tank) => tank.ix);
    const options = tankIxs.length > 0 ? { tankIxs } : {};
    (0, mockTelemetry_1.startMockTelemetry)((payload) => {
        const ref = payload.ix ?? payload.id;
        if (ref === undefined)
            return;
        emitTelemetry(ref, payload, 'mock');
    }, options);
};
const stopMock = () => {
    (0, mockTelemetry_1.stopMockTelemetry)();
};
const startLive = () => {
    const url = env_1.env.mqtt.url;
    if (!url) {
        startMock();
        return;
    }
    mode = 'live';
    const options = {
        reconnectPeriod: env_1.env.mqtt.reconnectPeriod,
    };
    if (env_1.env.mqtt.username) {
        options.username = env_1.env.mqtt.username;
    }
    if (env_1.env.mqtt.password) {
        options.password = env_1.env.mqtt.password;
    }
    client = mqtt_1.default.connect(url, options);
    client.on('connect', () => {
        client?.subscribe(env_1.env.mqtt.topics.telemetry);
        client?.subscribe(CONFIG_TOPIC);
        client?.subscribe('global/prod/+/mode');
    });
    client.on('message', (topic, rawBuffer) => {
        const rawMessage = rawBuffer.toString();
        if (topic === CONFIG_TOPIC) {
            handleConfigMessage(rawMessage);
            return;
        }
        if (topic.startsWith('global/prod/') && topic.endsWith('/mode')) {
            handleModeMessage(topic, rawMessage);
            return;
        }
        try {
            const data = JSON.parse(rawMessage);
            const idFromTopic = topic.split('/')[1];
            const tankRef = data.ix ?? data.id ?? idFromTopic;
            if (tankRef === undefined)
                return;
            emitTelemetry(tankRef, data, 'mqtt');
        }
        catch (error) {
            console.error('[MQTT] Impossible de parser le message', error);
        }
    });
    client.on('error', (error) => {
        console.error('[MQTT] Erreur client', error);
    });
};
exports.mqttGateway = {
    start: () => {
        if (started)
            return;
        started = true;
        if (mode === 'mock') {
            startMock();
        }
        else {
            startLive();
        }
        emitConfig(configRepository_1.configRepository.list());
    },
    stop: () => {
        if (!started)
            return;
        started = false;
        if (mode === 'mock') {
            stopMock();
        }
        else if (client) {
            client.end(true);
            client.removeAllListeners();
            client = undefined;
        }
    },
    switchMode: (nextMode) => {
        exports.mqttGateway.stop();
        mode = nextMode;
        exports.mqttGateway.start();
    },
    publishCommand: (tankIx, command) => {
        if (mode === 'mock') {
            console.info('[MQTT mock] commande', tankIx, command);
            return;
        }
        if (!client) {
            console.warn('[MQTT] Client non initialisé');
            return;
        }
        const topic = `${env_1.env.mqtt.topics.commands}/${tankIx}`;
        client.publish(topic, JSON.stringify(command), { qos: 1 });
    },
    publishGeneralMode: (cuverieName, modeValue) => {
        if (mode === 'mock') {
            console.info('[MQTT mock] mode général', cuverieName, modeValue);
            return;
        }
        if (!client) {
            console.warn('[MQTT] Client non initialisé');
            return;
        }
        client.publish(CUVERIE_MODE_TOPIC(cuverieName), modeValue, { qos: 1 });
    },
    onTelemetry: (listener) => {
        telemetryEmitter.on('telemetry', listener);
        return () => telemetryEmitter.off('telemetry', listener);
    },
    onConfig: (listener) => {
        configEmitter.on('config', listener);
        return () => configEmitter.off('config', listener);
    },
    getMode: () => mode,
};
//# sourceMappingURL=mqttGateway.js.map