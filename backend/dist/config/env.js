"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().optional(),
    MQTT_URL: zod_1.z.string().optional(),
    MQTT_USERNAME: zod_1.z.string().optional(),
    MQTT_PASSWORD: zod_1.z.string().optional(),
    MQTT_TOPIC_TELEMETRY: zod_1.z.string().optional(),
    MQTT_TOPIC_COMMANDS: zod_1.z.string().optional(),
    MQTT_TOPIC_ALARMES: zod_1.z.string().optional(),
    MQTT_RECONNECT_PERIOD: zod_1.z.string().optional(),
    ENABLE_MQTT_MOCK: zod_1.z.string().optional(),
    AUTH_SECRET: zod_1.z.string().optional(),
    DEMO_USER_EMAIL: zod_1.z.string().optional(),
    DEMO_USER_PASSWORD: zod_1.z.string().optional(),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Configuration environnement invalide', parsed.error.flatten().fieldErrors);
    throw new Error('Impossible de charger les variables d’environnement.');
}
const toNumber = (value, fallback) => {
    if (!value)
        return fallback;
    const parsedValue = Number(value);
    return Number.isNaN(parsedValue) ? fallback : parsedValue;
};
const toBoolean = (value, fallback) => {
    if (!value)
        return fallback;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};
exports.env = {
    nodeEnv: parsed.data.NODE_ENV,
    port: toNumber(parsed.data.PORT, 4000),
    mqtt: {
        url: parsed.data.MQTT_URL,
        username: parsed.data.MQTT_USERNAME,
        password: parsed.data.MQTT_PASSWORD,
        topics: {
            telemetry: parsed.data.MQTT_TOPIC_TELEMETRY ?? 'cuverie/+/telemetrie',
            commands: parsed.data.MQTT_TOPIC_COMMANDS ?? 'cuverie/commandes',
            alarms: parsed.data.MQTT_TOPIC_ALARMES ?? 'cuverie/alarmes',
        },
        reconnectPeriod: toNumber(parsed.data.MQTT_RECONNECT_PERIOD, 2000),
        enableMock: toBoolean(parsed.data.ENABLE_MQTT_MOCK, true),
    },
    auth: {
        secret: parsed.data.AUTH_SECRET ?? 'dev-secret-change-me',
        demoUser: {
            email: parsed.data.DEMO_USER_EMAIL ?? 'demo@cuverie.local',
            password: parsed.data.DEMO_USER_PASSWORD ?? 'cuverie',
        },
    },
};
//# sourceMappingURL=env.js.map