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
const emitTelemetry = (tankId, payload, source) => {
    const updated = tankRepository_1.tankRepository.applyTelemetry(tankId, payload);
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
const normalizeTankId = (cuverieId, tank) => {
    if (tank.ID !== undefined) {
        return `${cuverieId}-tank-${tank.ID}`;
    }
    if (tank.IX !== undefined) {
        return `${cuverieId}-ix-${tank.IX}`;
    }
    return `${cuverieId}-${(tank.Nom ?? 'tank').toLowerCase().replace(/\s+/g, '-')}`;
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
                id: normalizeTankId(cuverieId, typed),
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
    (0, mockTelemetry_1.startMockTelemetry)((payload) => {
        emitTelemetry(payload.id, payload, 'mock');
    });
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
            const tankId = data.id ?? idFromTopic;
            if (!tankId)
                return;
            emitTelemetry(tankId, data, 'mqtt');
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
    publishCommand: (tankId, command) => {
        if (mode === 'mock') {
            console.info('[MQTT mock] commande', tankId, command);
            return;
        }
        if (!client) {
            console.warn('[MQTT] Client non initialisé');
            return;
        }
        const topic = `${env_1.env.mqtt.topics.commands}/${tankId}`;
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