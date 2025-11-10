import { appConfig } from './app'

export type MqttGatewayMode = 'mock' | 'live' | 'socket'

export interface MqttConfig {
  url?: string
  username?: string
  password?: string
  reconnectPeriod: number
  topics: {
    telemetry: string
    commands: string
    alarms: string
  }
  enableMock: boolean
}

const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) return defaultValue
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
}

const parseNumber = (value: string | undefined, defaultValue: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : defaultValue
}

export const mqttConfig: MqttConfig = {
  url: import.meta.env.VITE_MQTT_URL,
  username: import.meta.env.VITE_MQTT_USERNAME,
  password: import.meta.env.VITE_MQTT_PASSWORD,
  reconnectPeriod: parseNumber(import.meta.env.VITE_MQTT_RECONNECT_PERIOD, 2000),
  topics: {
    telemetry: import.meta.env.VITE_MQTT_TOPIC_TELEMETRY ?? 'cuverie/+/telemetrie',
    commands: import.meta.env.VITE_MQTT_TOPIC_COMMANDS ?? 'cuverie/commandes',
    alarms: import.meta.env.VITE_MQTT_TOPIC_ALARMES ?? 'cuverie/alarmes',
  },
  enableMock: parseBoolean(import.meta.env.VITE_ENABLE_MOCKS, true),
}

export const determineGatewayMode = (): MqttGatewayMode => {
  if (appConfig.realtimeMode === 'socket') return 'socket'
  if (!mqttConfig.url) return 'mock'
  return mqttConfig.enableMock ? 'mock' : 'live'
}

