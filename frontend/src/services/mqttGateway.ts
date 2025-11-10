import mqtt, { type MqttClient } from 'mqtt'
import { io, type Socket } from 'socket.io-client'
import { type Tank } from '../types'
import { startMockTelemetry, stopMockTelemetry } from './mockTelemetry'
import { determineGatewayMode, mqttConfig, type MqttGatewayMode } from '../config/mqtt'
import { useMqttStore } from '../store/mqttStore'
import { appConfig } from '../config/app'
import { useAuthStore } from '../store/authStore'

type TelemetryListener = (payload: Partial<Tank> & { id: string }) => void

export interface PublishOptions {
  retain?: boolean
  qos?: 0 | 1 | 2
}

const listeners = new Set<TelemetryListener>()

let client: MqttClient | undefined
let socket: Socket | undefined
let started = false
let mode: MqttGatewayMode = determineGatewayMode()

const defaultPublishOptions: PublishOptions = {
  qos: 0,
  retain: false,
}

const getTopicForTank = (tankId: string, suffix: string) => `${tankId}/${suffix}`

const emit = (payload: Partial<Tank> & { id: string }) => {
  listeners.forEach((listener) => listener(payload))
  useMqttStore.getState().recordMessage()
}

const startMock = () => {
  mode = 'mock'
  useMqttStore.getState().setMode(mode)
  useMqttStore.getState().setStatus('connected')
  useMqttStore.getState().setError(undefined)
  startMockTelemetry(emit)
}

const stopMock = () => {
  stopMockTelemetry()
}

const startLive = () => {
  const url = mqttConfig.url
  if (!url) {
    startMock()
    return
  }

  mode = 'live'
  useMqttStore.getState().setMode(mode)
  useMqttStore.getState().setStatus('connecting')
  useMqttStore.getState().setError(undefined)

  client = mqtt.connect(url, {
    username: mqttConfig.username,
    password: mqttConfig.password,
    reconnectPeriod: mqttConfig.reconnectPeriod,
  })

  client.on('connect', () => {
    useMqttStore.getState().setStatus('connected')
    client?.subscribe(mqttConfig.topics.telemetry, (error) => {
      if (error) {
        useMqttStore.getState().setStatus('error')
        useMqttStore.getState().setError(error.message)
      }
    })
  })

  client.on('reconnect', () => {
    useMqttStore.getState().setStatus('connecting')
  })

  client.on('close', () => {
    useMqttStore.getState().setStatus('disconnected')
  })

  client.on('error', (error) => {
    useMqttStore.getState().setError(error?.message ?? 'Erreur de connexion MQTT')
  })

  client.on('message', (topic, raw) => {
    try {
      const payload = JSON.parse(raw.toString()) as Partial<Tank> & { id?: string }
      if (!payload.id) {
        const segments = topic.split('/')
        const tankId = segments[1] ?? segments[0]
        if (!tankId) return
        payload.id = tankId
      }
      emit(payload as Partial<Tank> & { id: string })
    } catch (error) {
      console.error('Impossible de parser le message MQTT', error)
      useMqttStore.getState().setError('Message MQTT invalide')
    }
  })
}

const stopLive = () => {
  if (!client) return
  client.end(true)
  client.removeAllListeners()
  client = undefined
}

const startSocket = () => {
  if (!appConfig.apiUrl) {
    startMock()
    return
  }
  mode = 'socket'
  useMqttStore.getState().setMode(mode)
  useMqttStore.getState().setStatus('connecting')
  useMqttStore.getState().setError(undefined)

  const token = useAuthStore.getState().token
  socket = io(appConfig.apiUrl, {
    transports: ['websocket'],
    auth: token ? { token } : undefined,
  })

  socket.on('connect', () => {
    useMqttStore.getState().setStatus('connected')
  })

  socket.on('disconnect', () => {
    useMqttStore.getState().setStatus('disconnected')
  })

  socket.on('connect_error', (error) => {
    useMqttStore.getState().setStatus('error')
    useMqttStore.getState().setError(error.message)
  })

  socket.on('tanks:init', (tanks: Tank[]) => {
    tanks.forEach((tank) => emit({ ...tank }))
  })

  socket.on('tanks:update', (tank: Tank) => {
    emit({ ...tank })
  })
}

const stopSocket = () => {
  if (!socket) return
  socket.off()
  socket.disconnect()
  socket = undefined
}

const startGateway = (forcedMode?: MqttGatewayMode) => {
  if (started) return
  started = true
  const effectiveMode = forcedMode ?? determineGatewayMode()
  if (effectiveMode === 'mock') {
    startMock()
  } else if (effectiveMode === 'socket') {
    startSocket()
  } else {
    startLive()
  }
}

const stopGateway = () => {
  if (!started) return
  started = false
  if (mode === 'mock') {
    stopMock()
  } else if (mode === 'socket') {
    stopSocket()
  } else {
    stopLive()
  }
  useMqttStore.getState().reset()
}

const switchMode = (nextMode: MqttGatewayMode) => {
  stopGateway()
  mode = nextMode
  startGateway(nextMode)
}

const publishCommand = (tankId: string, command: Record<string, unknown>, options: PublishOptions = {}) => {
  if (mode === 'mock' || mode === 'socket') {
    console.info('[MQTT mock] commande envoyée', tankId, command)
    return
  }

  if (!client) {
    console.warn('Client MQTT non initialisé, commande ignorée')
    return
  }

  const topic = `${mqttConfig.topics.commands}/${getTopicForTank(tankId, 'actions')}`
  client.publish(topic, JSON.stringify(command), { ...defaultPublishOptions, ...options })
}

const subscribeTelemetry = (listener: TelemetryListener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const mqttGateway = {
  start: startGateway,
  stop: stopGateway,
  restart: (modeOverride?: MqttGatewayMode) => {
    stopGateway()
    startGateway(modeOverride)
  },
  switchMode,
  onTelemetry: subscribeTelemetry,
  publishCommand,
  getMode: () => mode,
}

