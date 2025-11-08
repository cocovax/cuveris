import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().optional(),
  MQTT_URL: z.string().optional(),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  MQTT_TOPIC_TELEMETRY: z.string().optional(),
  MQTT_TOPIC_COMMANDS: z.string().optional(),
  MQTT_TOPIC_ALARMES: z.string().optional(),
  MQTT_RECONNECT_PERIOD: z.string().optional(),
  ENABLE_MQTT_MOCK: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Configuration environnement invalide', parsed.error.flatten().fieldErrors)
  throw new Error('Impossible de charger les variables d’environnement.')
}

const toNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback
  const parsedValue = Number(value)
  return Number.isNaN(parsedValue) ? fallback : parsedValue
}

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (!value) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

export const env = {
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
}

export type AppEnv = typeof env

