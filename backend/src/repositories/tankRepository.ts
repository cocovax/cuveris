import { type Tank, type TankContents, type TemperatureSample } from '../domain/models'
import { getDataContext } from '../data/dataContext'

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
    updateTank(id, (tank) => ({
      ...tank,
      setpoint,
    })),
  updateRunning: (id: string, isRunning: boolean) =>
    updateTank(id, (tank) => ({
      ...tank,
      isRunning,
      status: isRunning ? 'cooling' : 'idle',
    })),
  updateContents: (id: string, contents: TankContents) =>
    updateTank(id, (tank) => ({
      ...tank,
      contents,
    })),
  applyTelemetry: (id: string, payload: Partial<Tank>) => {
    if (payload.temperature !== undefined) {
      const sample: TemperatureSample = {
        timestamp: new Date().toISOString(),
        value: payload.temperature,
      }
      ctx().temperatureHistory.append(id, sample)
    }
    return updateTank(id, (tank) => ({
      ...tank,
      ...payload,
      history: ctx().temperatureHistory.list(id, 48),
    }))
  },
}

