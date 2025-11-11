const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
}

type RealtimeMode = 'socket' | 'mqtt' | 'mock'

const apiUrl = import.meta.env.VITE_API_URL as string | undefined
const realtimeModeEnv = import.meta.env.VITE_REALTIME_MODE as string | undefined
const mqttUrl = import.meta.env.VITE_MQTT_URL as string | undefined
const enableMocksDefault = parseBoolean(import.meta.env.VITE_ENABLE_MOCKS, !apiUrl)

const determineRealtimeMode = (): RealtimeMode => {
  if (realtimeModeEnv === 'socket') return 'socket'
  if (realtimeModeEnv === 'mqtt') return 'mqtt'
  if (realtimeModeEnv === 'mock') return 'mock'

  if (!enableMocksDefault && mqttUrl) {
    return 'mqtt'
  }

  if (apiUrl) return 'socket'
  return 'mock'
}

export const appConfig = {
  apiUrl: apiUrl?.replace(/\/$/, '') ?? null,
  realtimeMode: determineRealtimeMode(),
  enableMocks: enableMocksDefault,
}

export type AppConfig = typeof appConfig

