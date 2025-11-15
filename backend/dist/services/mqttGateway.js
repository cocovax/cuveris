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
// Log de diagnostic au chargement du module
console.log('[MQTT Gateway] Configuration:', {
    enableMock: env_1.env.mqtt.enableMock,
    url: env_1.env.mqtt.url,
    mode: env_1.env.mqtt.enableMock || !env_1.env.mqtt.url ? 'mock' : 'live',
});
const CONFIG_TOPIC = 'global/config/cuves';
const CUVERIE_MODE_TOPIC = (cuverieName) => `global/prod/${cuverieName}/mode`;
// Topics MQTT pour les cuves selon le cahier des charges
const TANK_TEMP_TOPIC = (ix) => `cuve/${ix}/temp`;
const TANK_SETPOINT_TOPIC = (ix) => `cuve/${ix}/consigne`;
const TANK_STATE_TOPIC = (ix) => `cuve/${ix}/etat`;
const TANK_CONTENTS_TOPIC = (ix) => `cuve/${ix}/contenu`;
const TANK_SET_SETPOINT_TOPIC = (ix) => `cuve/${ix}/set/consigne`;
const TANK_SET_CONTENTS_TOPIC = (ix) => `cuve/${ix}/set/contenu`;
const TANK_SET_MODE_TOPIC = (ix) => `cuve/${ix}/set/mode`;
// Map pour suivre la dernière mise à jour de chaque cuve (pour détecter offline)
const lastTankUpdate = new Map();
const OFFLINE_TIMEOUT_MS = 60_000; // 1 minute sans message = offline
let offlineCheckInterval;
// Fonction pour s'abonner aux topics des cuves configurées
const subscribeToTankTopics = () => {
    if (!client || mode !== 'live')
        return;
    const tanks = tankRepository_1.tankRepository.list();
    const topicsToSubscribe = new Set();
    tanks.forEach((tank) => {
        topicsToSubscribe.add(TANK_TEMP_TOPIC(tank.ix));
        topicsToSubscribe.add(TANK_SETPOINT_TOPIC(tank.ix));
        topicsToSubscribe.add(TANK_STATE_TOPIC(tank.ix));
        topicsToSubscribe.add(TANK_CONTENTS_TOPIC(tank.ix));
    });
    if (topicsToSubscribe.size > 0) {
        console.log(`[MQTT] Abonnement aux topics des cuves: ${Array.from(topicsToSubscribe).join(', ')}`);
        topicsToSubscribe.forEach((topic) => {
            client?.subscribe(topic, (err, granted) => {
                if (err) {
                    console.error(`[MQTT] Erreur abonnement à ${topic}:`, err);
                }
                else {
                    console.log(`[MQTT] Abonné à ${topic}, granted:`, granted);
                }
            });
        });
    }
};
// Vérification périodique du statut offline des cuves
const checkOfflineTanks = () => {
    const now = Date.now();
    const tanks = tankRepository_1.tankRepository.list();
    tanks.forEach((tank) => {
        const lastUpdate = lastTankUpdate.get(tank.ix);
        if (lastUpdate === undefined) {
            // Cuve jamais mise à jour via MQTT, marquer comme offline
            if (tank.status !== 'offline') {
                console.log(`[MQTT] Cuve ${tank.ix} jamais mise à jour, statut: offline`);
                emitTelemetry(tank.ix, { status: 'offline' }, 'mqtt');
            }
        }
        else if (now - lastUpdate > OFFLINE_TIMEOUT_MS) {
            // Dernière mise à jour trop ancienne, marquer comme offline
            if (tank.status !== 'offline') {
                console.log(`[MQTT] Cuve ${tank.ix} hors ligne (dernière mise à jour: ${now - lastUpdate}ms)`);
                emitTelemetry(tank.ix, { status: 'offline' }, 'mqtt');
            }
        }
    });
};
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
        console.log(`[MQTT] Synchronisation cuverie: ${cuverie.id} (${cuverie.tanks.length} cuves)`);
        configRepository_1.configRepository.upsert(cuverie);
        cuverie.tanks.forEach((tank) => {
            const created = tankRepository_1.tankRepository.upsertFromConfig(cuverie.id, tank);
            console.log(`[MQTT] Cuve créée/mise à jour: ${tank.ix} (${tank.displayName})`);
        });
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
    const finalConfig = configRepository_1.configRepository.list();
    console.log(`[MQTT] Configuration finale: ${finalConfig.length} cuverie(s)`);
    emitConfig(finalConfig);
    // Réabonner aux topics des cuves après mise à jour de la config
    if (client && mode === 'live') {
        setTimeout(() => subscribeToTankTopics(), 100);
    }
};
const handleConfigMessage = (raw) => {
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        console.log('[MQTT] Configuration parsée:', JSON.stringify(parsed));
        const cuveries = parseCuverieMessage(parsed);
        console.log(`[MQTT] ${cuveries.length} cuverie(s) trouvée(s)`);
        if (cuveries.length > 0) {
            syncConfig(cuveries);
            console.log('[MQTT] Configuration synchronisée');
        }
        else {
            console.warn('[MQTT] Aucune cuverie valide dans la configuration');
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
        console.log('[MQTT] Pas d\'URL MQTT, passage en mode mock');
        startMock();
        return;
    }
    console.log(`[MQTT] Connexion au broker: ${url}`);
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
    console.log('[MQTT] Création du client MQTT avec options:', {
        url,
        reconnectPeriod: options.reconnectPeriod,
        hasUsername: !!options.username,
        hasPassword: !!options.password,
    });
    client = mqtt_1.default.connect(url, options);
    client.on('connect', (connack) => {
        console.log('[MQTT] Connecté au broker MQTT, connack:', connack);
        // Topics globaux
        const globalTopics = [CONFIG_TOPIC, 'global/prod/+/mode'];
        console.log(`[MQTT] Abonnement aux topics globaux: ${globalTopics.join(', ')}`);
        globalTopics.forEach((topic) => {
            client?.subscribe(topic, (err, granted) => {
                if (err) {
                    console.error(`[MQTT] Erreur abonnement à ${topic}:`, err);
                }
                else {
                    console.log(`[MQTT] Abonné à ${topic}, granted:`, granted);
                }
            });
        });
        // S'abonner aux topics des cuves configurées
        subscribeToTankTopics();
    });
    client.on('message', (topic, rawBuffer) => {
        const rawMessage = rawBuffer.toString();
        console.log(`[MQTT] Message reçu sur topic: ${topic}`, rawMessage.substring(0, 200));
        // Topic de configuration
        if (topic === CONFIG_TOPIC) {
            console.log('[MQTT] Traitement du message de configuration');
            handleConfigMessage(rawMessage);
            // Réabonner aux topics des nouvelles cuves après mise à jour de la config
            if (client && mode === 'live') {
                setTimeout(() => subscribeToTankTopics(), 100);
            }
            return;
        }
        // Topic de mode général de cuverie
        if (topic.startsWith('global/prod/') && topic.endsWith('/mode')) {
            handleModeMessage(topic, rawMessage);
            return;
        }
        // Topics des cuves : cuve/{IX}/temp, cuve/{IX}/consigne, cuve/{IX}/etat
        if (topic.startsWith('cuve/')) {
            handleTankMessage(topic, rawMessage);
            return;
        }
        // Fallback pour l'ancien format de télémétrie (compatibilité)
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
    // Gestion des messages des cuves selon le format du cahier des charges
    const handleTankMessage = (topic, message) => {
        const segments = topic.split('/');
        if (segments.length < 3)
            return;
        const tankIx = Number(segments[1]);
        if (!Number.isFinite(tankIx))
            return;
        const dataType = segments[2]; // temp, consigne, etat
        const payload = { ix: tankIx };
        // Mettre à jour le timestamp de dernière réception
        lastTankUpdate.set(tankIx, Date.now());
        try {
            switch (dataType) {
                case 'temp':
                    // Température : REAL
                    const temp = Number(message.trim());
                    if (Number.isFinite(temp)) {
                        payload.temperature = temp;
                        console.log(`[MQTT] Température cuve ${tankIx}: ${temp}°C`);
                    }
                    break;
                case 'consigne':
                    // Consigne : REAL
                    const setpoint = Number(message.trim());
                    if (Number.isFinite(setpoint)) {
                        payload.setpoint = setpoint;
                        console.log(`[MQTT] Consigne cuve ${tankIx}: ${setpoint}°C`);
                    }
                    break;
                case 'etat':
                    // État : STRING (FROID, CHAUD, ATT, ARRET)
                    const state = message.trim().toUpperCase();
                    const statusMap = {
                        'FROID': 'cooling',
                        'CHAUD': 'heating',
                        'ATT': 'idle',
                        'ARRET': 'idle',
                    };
                    if (statusMap[state]) {
                        payload.status = statusMap[state];
                        payload.isRunning = state === 'FROID' || state === 'CHAUD';
                        console.log(`[MQTT] État cuve ${tankIx}: ${state} -> ${payload.status}`);
                    }
                    break;
                case 'contenu':
                    // Contenu : STRING (affectation)
                    const affectation = message.trim();
                    if (affectation.length > 0) {
                        // Récupérer la cuve actuelle pour préserver les autres infos (vintage, volume, notes)
                        const currentTank = tankRepository_1.tankRepository.getByIx(tankIx);
                        if (currentTank) {
                            const currentContents = currentTank.contents;
                            // Mettre à jour uniquement l'affectation, garder les autres infos
                            const updatedContents = {
                                grape: affectation,
                                vintage: currentContents?.vintage ?? new Date().getFullYear(),
                                volumeLiters: currentContents?.volumeLiters ?? currentTank.capacityLiters,
                                ...(currentContents?.notes && { notes: currentContents.notes }),
                            };
                            // Mettre à jour en BDD via le repository
                            tankRepository_1.tankRepository.updateContents(tankIx, updatedContents);
                            payload.contents = updatedContents;
                            console.log(`[MQTT] Contenu cuve ${tankIx}: ${affectation}`);
                        }
                        else {
                            // Cuve non trouvée, créer un contenu minimal
                            const newContents = {
                                grape: affectation,
                                vintage: new Date().getFullYear(),
                                volumeLiters: 0,
                            };
                            tankRepository_1.tankRepository.updateContents(tankIx, newContents);
                            payload.contents = newContents;
                            console.log(`[MQTT] Contenu cuve ${tankIx} (nouvelle): ${affectation}`);
                        }
                    }
                    break;
            }
            // Mettre à jour la cuve si on a reçu des données
            if (Object.keys(payload).length > 1) { // Plus que juste l'ix
                emitTelemetry(tankIx, payload, 'mqtt');
            }
        }
        catch (error) {
            console.error(`[MQTT] Erreur traitement message cuve ${tankIx} (${dataType}):`, error);
        }
    };
    client.on('error', (error) => {
        console.error('[MQTT] Erreur client MQTT:', error);
        console.error('[MQTT] Stack:', error.stack);
    });
    client.on('close', () => {
        console.log('[MQTT] Connexion fermée');
    });
    client.on('offline', () => {
        console.log('[MQTT] Client hors ligne');
    });
    client.on('reconnect', () => {
        console.log('[MQTT] Reconnexion au broker...');
    });
    client.on('end', () => {
        console.log('[MQTT] Connexion terminée');
    });
    // Démarrer la vérification périodique du statut offline
    if (offlineCheckInterval) {
        clearInterval(offlineCheckInterval);
    }
    offlineCheckInterval = setInterval(checkOfflineTanks, 10_000); // Vérifier toutes les 10 secondes
    console.log('[MQTT] Vérification périodique du statut offline activée');
};
exports.mqttGateway = {
    start: () => {
        if (started) {
            console.log('[MQTT Gateway] Déjà démarré en mode:', mode);
            return;
        }
        started = true;
        console.log(`[MQTT Gateway] Démarrage en mode: ${mode}`);
        if (mode === 'mock') {
            console.log('[MQTT Gateway] Mode mock activé');
            startMock();
        }
        else {
            console.log('[MQTT Gateway] Mode live activé');
            startLive();
        }
        const initialConfig = configRepository_1.configRepository.list();
        console.log(`[MQTT Gateway] Configuration initiale: ${initialConfig.length} cuverie(s)`);
        emitConfig(initialConfig);
    },
    stop: () => {
        if (!started)
            return;
        started = false;
        if (offlineCheckInterval) {
            clearInterval(offlineCheckInterval);
            offlineCheckInterval = undefined;
        }
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
        // Format selon le cahier des charges : cuve/{IX}/set/...
        const commandType = command.type;
        let topic;
        let payload;
        switch (commandType) {
            case 'setpoint':
                topic = TANK_SET_SETPOINT_TOPIC(tankIx);
                payload = String(command.value ?? '');
                break;
            case 'contents':
                topic = TANK_SET_CONTENTS_TOPIC(tankIx);
                // Format STRING selon le cahier des charges : juste l'affectation (grape)
                // Les autres infos (volume, vintage, notes) sont stockées uniquement en BDD
                const contentsValue = command.value;
                if (typeof contentsValue === 'string') {
                    payload = contentsValue;
                }
                else if (contentsValue && typeof contentsValue === 'object' && 'grape' in contentsValue) {
                    payload = contentsValue.grape;
                }
                else {
                    payload = '';
                }
                break;
            case 'running':
                topic = TANK_SET_MODE_TOPIC(tankIx);
                // Format BOOL selon le cahier des charges : "true" ou "false"
                payload = command.value ? 'true' : 'false';
                break;
            default:
                // Fallback pour compatibilité
                topic = `${env_1.env.mqtt.topics.commands}/${tankIx}`;
                payload = JSON.stringify(command);
        }
        console.log(`[MQTT] Publication commande sur ${topic}: ${payload.substring(0, 100)}`);
        client.publish(topic, payload, { qos: 1 });
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