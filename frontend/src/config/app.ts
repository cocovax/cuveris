const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase())
}

type RealtimeMode = 'socket' | 'mqtt' | 'mock'

const apiUrl = import.meta.env.VITE_API_URL as string | undefined
const realtimeModeEnv = import.meta.env.VITE_REALTIME_MODE as string | undefined

const determineRealtimeMode = (): RealtimeMode => {
  if (realtimeModeEnv === 'mqtt') return 'mqtt'
  if (realtimeModeEnv === 'mock') return 'mock'
  if (apiUrl) return 'socket'
  return 'mock'
}

export const appConfig = {
  apiUrl: apiUrl?.replace(/\/$/, '') ?? null,
  realtimeMode: determineRealtimeMode(),
  enableMocks: parseBoolean(import.meta.env.VITE_ENABLE_MOCKS, !apiUrl),
}

export type AppConfig = typeof appConfig

