import { type Tank, type TankContents, type TemperatureSample } from '../domain/models'
import { type TankConfig } from '../domain/config'
import { getDataContext, postgresAdapters } from '../data/dataContext'
import { eventRepository } from './eventRepository'

const ctx = () => getDataContext()

const updateTank = (ix: number, updater: (tank: Tank) => Tank) => {
  const existing = ctx().tanks.getByIx(ix)
  if (!existing || existing.isDeleted) {
    return undefined
  }

  return ctx().tanks.update(ix, (tank) => {
    if (tank.isDeleted) {
      return tank
    }
    const updated = updater(tank)
    return {
      ...updated,
      history: ctx().temperatureHistory.list(ix, 48),
    }
  })
}

const createTankFromConfig = (cuverieId: string, config: TankConfig): Tank => ({
  ix: config.ix,
  id: config.id,
  name: config.displayName,
  status: 'idle',
  temperature: 20,
  setpoint: 20,
  capacityLiters: 5000,
  fillLevelPercent: 50,
  isRunning: false,
  lastUpdatedAt: new Date().toISOString(),
  history: [],
  alarms: [],
  cuverieId,
  isDeleted: false,
})

export const tankRepository = {
  list: () => ctx().tanks.list().filter((tank) => !tank.isDeleted),
  getByIx: (ix: number) => {
    const tank = ctx().tanks.getByIx(ix)
    return tank && !tank.isDeleted ? tank : undefined
  },
  upsertFromConfig: (cuverieId: string, config: TankConfig) => {
    const existing = ctx().tanks.getByIx(config.ix)
    if (!existing) {
      const created = createTankFromConfig(cuverieId, config)
      ctx().tanks.create(created)
      return created
    }
    return ctx().tanks.update(config.ix, (tank) => ({
      ...tank,
      name: config.displayName,
      cuverieId,
      isDeleted: false,
    }))
  },
  removeMissing: (cuverieId: string, configs: TankConfig[]) => {
    const ixSet = new Set(configs.map((tank) => tank.ix))
    ctx()
      .tanks.list()
      .filter((tank) => tank.cuverieId === cuverieId && !ixSet.has(tank.ix))
      .forEach((tank) => {
        ctx().tanks.update(tank.ix, () => ({
          ...tank,
          status: 'offline',
          isDeleted: true,
        }))
      })
  },
  updateSetpoint: (ix: number, setpoint: number) =>
    updateTank(ix, (tank) => {
      eventRepository.append({
        id: `cmd-setpoint-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tankIx: tank.ix,
        category: 'command',
        source: 'user',
        summary: `Consigne mise à ${setpoint.toFixed(1)}°C`,
        metadata: { previous: tank.setpoint, next: setpoint },
      })
      return {
        ...tank,
        setpoint,
      }
    }),
  updateRunning: (ix: number, isRunning: boolean) =>
    updateTank(ix, (tank) => {
      eventRepository.append({
        id: `cmd-running-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tankIx: tank.ix,
        category: 'command',
        source: 'user',
        summary: isRunning ? 'Cuve démarrée' : 'Cuve arrêtée',
      })
      return {
        ...tank,
        isRunning,
        status: isRunning ? 'cooling' : 'idle',
      }
    }),
  updateContents: (ix: number, contents: TankContents) =>
    updateTank(ix, (tank) => {
      eventRepository.append({
        id: `cmd-contents-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tankIx: tank.ix,
        category: 'command',
        source: 'user',
        summary: 'Contenu mis à jour',
        metadata: { ...contents } as Record<string, unknown>,
      })
      return {
        ...tank,
        contents,
      }
    }),
  applyTelemetry: (ix: number, payload: Partial<Tank>) => {
    const current = ctx().tanks.getByIx(ix)
    if (!current || current.isDeleted) {
      return undefined
    }
    if (payload.temperature !== undefined) {
      const sample: TemperatureSample = {
        timestamp: new Date().toISOString(),
        value: payload.temperature,
      }
      ctx().temperatureHistory.append(ix, sample)
      if (postgresAdapters) {
        void postgresAdapters.temperatureHistory
          .append(ix, sample)
          .catch((error) => console.error('[PostgresSync] Historique MQTT échoué', error))
      }
      eventRepository.append({
        id: `telemetry-${Date.now()}`,
        timestamp: sample.timestamp,
        tankIx: current.ix,
        category: 'telemetry',
        source: 'backend',
        summary: `Télémetrie ${sample.value.toFixed(1)}°C`,
      })
    }
    return updateTank(ix, (tank) => ({
      ...tank,
      ...payload,
      history: ctx().temperatureHistory.list(ix, 48),
      isDeleted: false,
    }))
  },
}

