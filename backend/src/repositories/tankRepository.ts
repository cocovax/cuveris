import { inMemoryStore } from './inMemoryStore'
import { type Tank, type TankContents } from '../domain/models'

const updateTank = (id: string, updater: (tank: Tank) => Tank) => {
  const index = inMemoryStore.tanks.findIndex((tank) => tank.id === id)
  if (index === -1) return undefined
  const current = inMemoryStore.tanks[index]
  if (!current) return undefined
  const updated = updater({ ...current })
  inMemoryStore.tanks[index] = { ...updated, lastUpdatedAt: new Date().toISOString() }
  return inMemoryStore.tanks[index]
}

export const tankRepository = {
  list: () => inMemoryStore.tanks,
  getById: (id: string) => inMemoryStore.tanks.find((tank) => tank.id === id),
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
  applyTelemetry: (id: string, payload: Partial<Tank>) =>
    updateTank(id, (tank) => ({
      ...tank,
      ...payload,
      history:
        payload.temperature !== undefined
          ? [
              ...tank.history.slice(-47),
              { timestamp: new Date().toISOString(), value: payload.temperature },
            ]
          : tank.history,
    })),
}

