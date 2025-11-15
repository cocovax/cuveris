import { type Tank, type TankContents, type TemperatureSample } from '../domain/models'
import { type TankConfig } from '../domain/config'
import { getDataContext, postgresAdapters } from '../data/dataContext'
import { eventRepository } from './eventRepository'
import { configRepository } from './configRepository'

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
  temperature: -99, // Valeur par défaut si aucune lecture MQTT
  setpoint: -99, // Valeur par défaut si aucune lecture MQTT
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
  list: () => {
    // Ne renvoyer que les cuves qui sont dans la configuration actuelle
    const cuveries = configRepository.list()
    if (cuveries.length === 0) {
      // Aucune configuration MQTT reçue, ne renvoyer aucune cuve
      return []
    }
    
    // Créer un Set des IX configurés
    const configuredIxs = new Set<number>()
    cuveries.forEach((cuverie) => {
      cuverie.tanks.forEach((tank) => {
        configuredIxs.add(tank.ix)
      })
    })
    
    // Filtrer les cuves pour ne garder que celles configurées
    return ctx()
      .tanks.list()
      .filter((tank) => !tank.isDeleted && configuredIxs.has(tank.ix))
  },
  getByIx: (ix: number) => {
    const tank = ctx().tanks.getByIx(ix)
    return tank && !tank.isDeleted ? tank : undefined
  },
  upsertFromConfig: (cuverieId: string, config: TankConfig) => {
    const existing = ctx().tanks.getByIx(config.ix)
    if (!existing) {
      const created = createTankFromConfig(cuverieId, config)
      ctx().tanks.create(created)
      // Synchroniser avec PostgreSQL
      if (postgresAdapters) {
        void postgresAdapters.tanks.upsert(created).catch((error) => {
          console.error('[PostgresSync] Erreur création cuve', config.ix, error)
        })
      }
      return created
    }
    const updated = ctx().tanks.update(config.ix, (tank) => ({
      ...tank,
      name: config.displayName,
      cuverieId,
      isDeleted: false,
    }))
    // Synchroniser avec PostgreSQL
    if (updated && postgresAdapters) {
      void postgresAdapters.tanks.upsert(updated).catch((error) => {
        console.error('[PostgresSync] Erreur mise à jour cuve', config.ix, error)
      })
    }
    return updated
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
        // Synchroniser avec PostgreSQL
        if (postgresAdapters) {
          void postgresAdapters.tanks.markAsDeleted(tank.ix).catch((error) => {
            console.error('[PostgresSync] Erreur suppression cuve', tank.ix, error)
          })
        }
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
  updateRunning: (ix: number, isRunning: boolean) => {
    const updated = updateTank(ix, (tank) => {
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
        lastUpdatedAt: new Date().toISOString(),
      }
    })
    // Synchroniser avec PostgreSQL
    if (updated && postgresAdapters) {
      void postgresAdapters.tanks.upsert(updated).catch((error) => {
        console.error('[PostgresSync] Erreur mise à jour running', ix, error)
      })
    }
    return updated
  },
  updateContents: (ix: number, contents: TankContents) => {
    const updated = updateTank(ix, (tank) => {
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
        lastUpdatedAt: new Date().toISOString(),
      }
    })
    // Synchroniser avec PostgreSQL
    if (updated && postgresAdapters) {
      void postgresAdapters.tanks.upsert(updated).catch((error) => {
        console.error('[PostgresSync] Erreur mise à jour contenu', ix, error)
      })
    }
    return updated
  },
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
    const updated = updateTank(ix, (tank) => ({
      ...tank,
      ...payload,
      history: ctx().temperatureHistory.list(ix, 48),
      isDeleted: false,
    }))
    // Synchroniser avec PostgreSQL
    if (updated && postgresAdapters) {
      void postgresAdapters.tanks.upsert(updated).catch((error) => {
        console.error('[PostgresSync] Erreur mise à jour télémétrie', ix, error)
      })
    }
    return updated
  },
}

