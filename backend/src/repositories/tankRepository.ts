import { type Tank, type TankContents, type TemperatureSample } from '../domain/models'
import { getDataContext } from '../data/dataContext'
import { eventRepository } from './eventRepository'

const ctx = () => getDataContext()

const updateTank = (id: string, updater: (tank: Tank) => Tank) => {
  return ctx().tanks.update(id, (tank) => {
    const updated = updater(tank)
    return {
      ...updated,
      history: ctx().temperatureHistory.list(id, 48),
    }
  })
}

export const tankRepository = {
  list: () => ctx().tanks.list(),
  getById: (id: string) => ctx().tanks.getById(id),
  updateSetpoint: (id: string, setpoint: number) =>
    updateTank(id, (tank) => {
      eventRepository.append({
        id: `cmd-setpoint-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tankId: id,
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
  updateRunning: (id: string, isRunning: boolean) =>
    updateTank(id, (tank) => {
      eventRepository.append({
        id: `cmd-running-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tankId: id,
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
  updateContents: (id: string, contents: TankContents) =>
    updateTank(id, (tank) => {
      eventRepository.append({
        id: `cmd-contents-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tankId: id,
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
  applyTelemetry: (id: string, payload: Partial<Tank>) => {
    if (payload.temperature !== undefined) {
      const sample: TemperatureSample = {
        timestamp: new Date().toISOString(),
        value: payload.temperature,
      }
      ctx().temperatureHistory.append(id, sample)
      eventRepository.append({
        id: `telemetry-${Date.now()}`,
        timestamp: sample.timestamp,
        tankId: id,
        category: 'telemetry',
        source: 'backend',
        summary: `Télémetrie ${sample.value.toFixed(1)}°C`,
      })
    }
    return updateTank(id, (tank) => ({
      ...tank,
      ...payload,
      history: ctx().temperatureHistory.list(id, 48),
    }))
  },
}

