import mqtt, { type IClientOptions, type MqttClient } from 'mqtt'
import { EventEmitter } from 'node:events'
import { env } from '../config/env'
import { startMockTelemetry, stopMockTelemetry } from './mockTelemetry'
import { tankRepository } from '../repositories/tankRepository'
import { configRepository } from '../repositories/configRepository'
import { modeRepository } from '../repositories/modeRepository'
import { type Tank } from '../domain/models'
import { type CuverieConfig, type GeneralMode, type TankConfig } from '../domain/config'

export type MqttGatewayMode = 'mock' | 'live'

export interface TelemetryEvent {
  tank: Tank
  source: 'mqtt' | 'mock'
}

export interface ConfigEvent {
  cuveries: Array<CuverieConfig & { mode: GeneralMode }>
}

type TelemetryListener = (event: TelemetryEvent) => void
type ConfigListener = (event: ConfigEvent) => void

const telemetryEmitter = new EventEmitter()
const configEmitter = new EventEmitter()
let client: MqttClient | undefined
let mode: MqttGatewayMode = env.mqtt.enableMock || !env.mqtt.url ? 'mock' : 'live'
let started = false

const CONFIG_TOPIC = 'global/config/cuves'
const CUVERIE_MODE_TOPIC = (cuverieName: string) => `global/prod/${cuverieName}/mode`

const resolveTankIx = (identifier: string | number | undefined): number | undefined => {
  if (typeof identifier === 'number' && Number.isFinite(identifier)) {
    return identifier
  }
  if (typeof identifier === 'string') {
    const numeric = Number(identifier)
    if (!Number.isNaN(numeric)) {
      return numeric
    }
    const tank = tankRepository.list().find((candidate) => candidate.id === identifier)
    if (tank) {
      return tank.ix
    }
  }
  return undefined
}

const emitTelemetry = (tankRef: string | number, payload: Partial<Tank>, source: TelemetryEvent['source']) => {
  const tankIx = resolveTankIx(tankRef)
  if (tankIx === undefined) return
  const updated = tankRepository.applyTelemetry(tankIx, payload)
  if (!updated) return
  telemetryEmitter.emit('telemetry', { tank: updated, source } satisfies TelemetryEvent)
}

const emitConfig = (cuveries: CuverieConfig[]) => {
  const enriched = cuveries.map((cuverie) => ({
    ...cuverie,
    mode: modeRepository.get(cuverie.id) ?? 'ARRET',
  }))
  configEmitter.emit('config', { cuveries: enriched } satisfies ConfigEvent)
}

const normalizeCuverieId = (name: string | undefined) => {
  if (!name || name.trim().length === 0 || name.toLowerCase() === 'default') {
    return 'default'
  }
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

const formatTankId = (cuverieId: string, baseId: number, fallbackName: string, index: number) => {
  const normalizedBase = Number.isFinite(baseId) ? baseId : index + 1
  const padded = String(normalizedBase).padStart(2, '0')
  if (cuverieId === 'default') {
    return `tank-${padded}`
  }
  return `${cuverieId}-tank-${padded}`
}

const normalizeTankId = (cuverieId: string, tank: { ID?: number; IX?: number; Nom?: string }, index: number) => {
  const base = tank.ID ?? tank.IX ?? index + 1
  return formatTankId(cuverieId, base, tank.Nom ?? 'tank', index)
}

const parseCuverieMessage = (payload: unknown): CuverieConfig[] => {
  const entries = Array.isArray(payload) ? payload : [payload]
  const cuveries: CuverieConfig[] = []
  for (const entry of entries) {
    if (typeof entry !== 'object' || entry === null) continue
    const { CUVERIE, CUVES } = entry as { CUVERIE?: string; CUVES?: unknown }
    const cuverieName = CUVERIE ?? 'default'
    const cuverieId = normalizeCuverieId(cuverieName)
    const rawTanks = Array.isArray(CUVES) ? CUVES : []
    const tanks: TankConfig[] = rawTanks
      .map((tank, index) => {
        if (typeof tank !== 'object' || tank === null) return undefined
        const typed = tank as { ID?: number; IX?: number; Nom?: string }
        return {
          id: normalizeTankId(cuverieId, typed, index),
          ix: typed.IX ?? typed.ID ?? index,
          displayName: typed.Nom ?? `Cuve ${index + 1}`,
          order: typed.ID ?? index,
        } satisfies TankConfig
      })
      .filter((tank): tank is TankConfig => Boolean(tank))
    cuveries.push({
      id: cuverieId,
      name: cuverieName,
      tanks,
    })
  }
  return cuveries
}

const syncConfig = (cuveries: CuverieConfig[]) => {
  const existing = new Set(configRepository.list().map((cuverie) => cuverie.id))
  const seen = new Set<string>()
  cuveries.forEach((cuverie) => {
    configRepository.upsert(cuverie)
    cuverie.tanks.forEach((tank) => tankRepository.upsertFromConfig(cuverie.id, tank))
    tankRepository.removeMissing(cuverie.id, cuverie.tanks)
    if (!modeRepository.get(cuverie.id)) {
      modeRepository.set(cuverie.id, 'ARRET')
    }
    seen.add(cuverie.id)
  })
  existing.forEach((id) => {
    if (!seen.has(id)) {
      configRepository.deleteById(id)
    }
  })
  emitConfig(configRepository.list())
}

const handleConfigMessage = (raw: unknown) => {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const cuveries = parseCuverieMessage(parsed)
    if (cuveries.length > 0) {
      syncConfig(cuveries)
    }
  } catch (error) {
    console.error('[MQTT] Configuration cuverie invalide', error)
  }
}

const handleModeMessage = (topic: string, message: string) => {
  const segments = topic.split('/')
  const cuverieName = segments[2]
  if (!cuverieName) return
  const cuverieId = normalizeCuverieId(cuverieName)
  const modeValue = message.trim().toUpperCase() as GeneralMode
  if (!['CHAUD', 'FROID', 'ARRET'].includes(modeValue)) return
  modeRepository.set(cuverieId, modeValue)
  emitConfig(configRepository.list())
}

const startMock = () => {
  stopMockTelemetry()
  mode = 'mock'
  const tankIxs = tankRepository.list().map((tank) => tank.ix)
  const options = tankIxs.length > 0 ? { tankIxs } : {}
  startMockTelemetry((payload) => {
    const ref = payload.ix ?? payload.id
    if (ref === undefined) return
    emitTelemetry(ref, payload, 'mock')
  }, options)
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
    client?.subscribe(CONFIG_TOPIC)
    client?.subscribe('global/prod/+/mode')
  })

  client.on('message', (topic, rawBuffer) => {
    const rawMessage = rawBuffer.toString()
    if (topic === CONFIG_TOPIC) {
      handleConfigMessage(rawMessage)
      return
    }

    if (topic.startsWith('global/prod/') && topic.endsWith('/mode')) {
      handleModeMessage(topic, rawMessage)
      return
    }

    try {
      const data = JSON.parse(rawMessage) as Partial<Tank> & { id?: string; ix?: number }
      const idFromTopic = topic.split('/')[1]
      const tankRef = data.ix ?? data.id ?? idFromTopic
      if (tankRef === undefined) return
      emitTelemetry(tankRef, data, 'mqtt')
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
    emitConfig(configRepository.list())
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
  publishCommand: (tankIx: number, command: Record<string, unknown>) => {
    if (mode === 'mock') {
      console.info('[MQTT mock] commande', tankIx, command)
      return
    }
    if (!client) {
      console.warn('[MQTT] Client non initialisé')
      return
    }
    const topic = `${env.mqtt.topics.commands}/${tankIx}`
    client.publish(topic, JSON.stringify(command), { qos: 1 })
  },
  publishGeneralMode: (cuverieName: string, modeValue: GeneralMode) => {
    if (mode === 'mock') {
      console.info('[MQTT mock] mode général', cuverieName, modeValue)
      return
    }
    if (!client) {
      console.warn('[MQTT] Client non initialisé')
      return
    }
    client.publish(CUVERIE_MODE_TOPIC(cuverieName), modeValue, { qos: 1 })
  },
  onTelemetry: (listener: TelemetryListener) => {
    telemetryEmitter.on('telemetry', listener)
    return () => telemetryEmitter.off('telemetry', listener)
  },
  onConfig: (listener: ConfigListener) => {
    configEmitter.on('config', listener)
    return () => configEmitter.off('config', listener)
  },
  getMode: () => mode,
}

