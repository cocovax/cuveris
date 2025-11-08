import mqtt, { type MqttClient } from 'mqtt'
import { type Tank } from '../types'
import { useMqttStore } from '../store/mqttStore'

type TelemetryListener = (payload: Partial<Tank> & { id: string }) => void

const listeners = new Set<TelemetryListener>()

let client: MqttClient | undefined
let mockTimer: ReturnType<typeof setInterval> | undefined
let started = false

const getEnv = (key: string) => import.meta.env[key] as string | undefined

function emit(payload: Partial<Tank> & { id: string }) {
  listeners.forEach((listener) => listener(payload))
  useMqttStore.getState().touch()
}

function startMockGenerator() {
  stopMockGenerator()
  useMqttStore.getState().setStatus('connected')

  mockTimer = setInterval(() => {
    const tankIds = ['tank-01', 'tank-02', 'tank-03']
    const tankId = tankIds[Math.floor(Math.random() * tankIds.length)]
    const delta = Number((Math.random() * 0.8 - 0.4).toFixed(2))
    emit({
      id: tankId,
      temperature: Number((20 + delta + Math.random() * 4).toFixed(2)),
      lastUpdatedAt: new Date().toISOString(),
    })
  }, 5000)
}

function stopMockGenerator() {
  if (mockTimer) {
    clearInterval(mockTimer)
    mockTimer = undefined
  }
}

function startRealClient() {
  const url = getEnv('VITE_MQTT_URL')
  if (!url) {
    startMockGenerator()
    return
  }

  const username = getEnv('VITE_MQTT_USERNAME')
  const password = getEnv('VITE_MQTT_PASSWORD')
  const topic = getEnv('VITE_MQTT_TOPIC') ?? 'cuverie/+/telemetrie'

  useMqttStore.getState().setStatus('connecting')
  client = mqtt.connect(url, {
    username,
    password,
    reconnectPeriod: 2000,
  })

  client.on('connect', () => {
    useMqttStore.getState().setStatus('connected')
    client?.subscribe(topic)
  })

  client.on('reconnect', () => useMqttStore.getState().setStatus('connecting'))
  client.on('close', () => {
    useMqttStore.getState().setStatus('disconnected')
    startMockGenerator()
  })
  client.on('error', () => {
    useMqttStore.getState().setStatus('disconnected')
  })

  client.on('message', (_, message) => {
    try {
      const payload = JSON.parse(message.toString()) as Partial<Tank> & { id: string }
      if (payload?.id) {
        emit(payload)
      }
    } catch (error) {
      console.error('Impossible de parser le message MQTT', error)
    }
  })
}

export function ensureMqttBridge() {
  if (started) return
  started = true
  startRealClient()
}

export function addTelemetryListener(listener: TelemetryListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function shutdownMqttBridge() {
  started = false
  listeners.clear()
  if (client) {
    client.end(true)
    client = undefined
  }
  stopMockGenerator()
  useMqttStore.getState().setStatus('disconnected')
}

