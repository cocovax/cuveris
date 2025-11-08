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
const emitter = new node_events_1.EventEmitter();
let client;
let mode = env_1.env.mqtt.enableMock || !env_1.env.mqtt.url ? 'mock' : 'live';
let started = false;
const emitTelemetry = (tankId, payload, source) => {
    const updated = tankRepository_1.tankRepository.applyTelemetry(tankId, payload);
    if (!updated)
        return;
    emitter.emit('telemetry', { tank: updated, source });
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
    });
    client.on('message', (topic, raw) => {
        try {
            const data = JSON.parse(raw.toString());
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
    onTelemetry: (listener) => {
        emitter.on('telemetry', listener);
        return () => emitter.off('telemetry', listener);
    },
    getMode: () => mode,
};
//# sourceMappingURL=mqttGateway.js.map