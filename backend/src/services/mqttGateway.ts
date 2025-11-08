import mqtt, { type IClientOptions, type MqttClient } from 'mqtt'
import { EventEmitter } from 'node:events'
import { env } from '../config/env'
import { startMockTelemetry, stopMockTelemetry } from './mockTelemetry'
import { tankRepository } from '../repositories/tankRepository'
import { type Tank } from '../domain/models'

export type MqttGatewayMode = 'mock' | 'live'

export interface TelemetryEvent {
  tank: Tank
  source: 'mqtt' | 'mock'
}

type TelemetryListener = (event: TelemetryEvent) => void

const emitter = new EventEmitter()
let client: MqttClient | undefined
let mode: MqttGatewayMode = env.mqtt.enableMock || !env.mqtt.url ? 'mock' : 'live'
let started = false

const emitTelemetry = (tankId: string, payload: Partial<Tank>, source: TelemetryEvent['source']) => {
  const updated = tankRepository.applyTelemetry(tankId, payload)
  if (!updated) return
  emitter.emit('telemetry', { tank: updated, source } satisfies TelemetryEvent)
}

const startMock = () => {
  stopMockTelemetry()
  mode = 'mock'
  startMockTelemetry((payload) => {
    emitTelemetry(payload.id, payload, 'mock')
  })
}

const stopMock = () => {
  stopMockTelemetry()
}

const startLive = () => {
  const url = env.mqtt.url
  if (!url) {
    startMock()
    return
  }
  mode = 'live'
  const options: IClientOptions = {
    reconnectPeriod: env.mqtt.reconnectPeriod,
  }
  if (env.mqtt.username) {
    options.username = env.mqtt.username
  }
  if (env.mqtt.password) {
    options.password = env.mqtt.password
  }

  client = mqtt.connect(url, options)

  client.on('connect', () => {
    client?.subscribe(env.mqtt.topics.telemetry)
  })

  client.on('message', (topic, raw) => {
    try {
      const data = JSON.parse(raw.toString()) as Partial<Tank> & { id?: string }
      const idFromTopic = topic.split('/')[1]
      const tankId = data.id ?? idFromTopic
      if (!tankId) return
      emitTelemetry(tankId, data, 'mqtt')
    } catch (error) {
      console.error('[MQTT] Impossible de parser le message', error)
    }
  })

  client.on('error', (error) => {
    console.error('[MQTT] Erreur client', error)
  })
}

export const mqttGateway = {
  start: () => {
    if (started) return
    started = true
    if (mode === 'mock') {
      startMock()
    } else {
      startLive()
    }
  },
  stop: () => {
    if (!started) return
    started = false
    if (mode === 'mock') {
      stopMock()
    } else if (client) {
      client.end(true)
      client.removeAllListeners()
      client = undefined
    }
  },
  switchMode: (nextMode: MqttGatewayMode) => {
    mqttGateway.stop()
    mode = nextMode
    mqttGateway.start()
  },
  publishCommand: (tankId: string, command: Record<string, unknown>) => {
    if (mode === 'mock') {
      console.info('[MQTT mock] commande', tankId, command)
      return
    }
    if (!client) {
      console.warn('[MQTT] Client non initialisé')
      return
    }
    const topic = `${env.mqtt.topics.commands}/${tankId}`
    client.publish(topic, JSON.stringify(command), { qos: 1 })
  },
  onTelemetry: (listener: TelemetryListener) => {
    emitter.on('telemetry', listener)
    return () => emitter.off('telemetry', listener)
  },
  getMode: () => mode,
}

