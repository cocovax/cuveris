import { create } from 'zustand'
import { type Alarm, type Tank, type TankContents } from '../types'
import {
  fetchAlarms,
  fetchTankById,
  fetchTankHistory,
  fetchTanks,
  toggleTank,
  updateTankContents,
  updateTankSetpoint,
} from '../services/api'

interface TankState {
  tanks: Tank[]
  alarms: Alarm[]
  loading: boolean
  selectedTank?: Tank
  selectedTankLoading: boolean
  initialize: () => Promise<void>
  selectTank: (id: string) => Promise<void>
  applyTelemetry: (payload: Partial<Tank> & { id: string }) => void
  setSetpoint: (id: string, setpoint: number) => Promise<void>
  toggleRunning: (id: string, isRunning: boolean) => Promise<void>
  updateContents: (id: string, contents: TankContents) => Promise<void>
}

export const useTankStore = create<TankState>((set) => ({
  tanks: [],
  alarms: [],
  loading: true,
  selectedTank: undefined,
  selectedTankLoading: false,

  initialize: async () => {
    set({ loading: true })
    const [tanks, alarms] = await Promise.all([fetchTanks(), fetchAlarms()])
    set({ tanks, alarms, loading: false })
  },

  selectTank: async (id: string) => {
    set({ selectedTankLoading: true })
    try {
      const tank = await fetchTankById(id)
      if (!tank) return
      const history = await fetchTankHistory(id)
      set({ selectedTank: { ...tank, history } })
    } finally {
      set({ selectedTankLoading: false })
    }
  },

  applyTelemetry: (payload) => {
    set((state) => {
      const tanks = state.tanks.map((tank) =>
        tank.id === payload.id ? { ...tank, ...payload, lastUpdatedAt: new Date().toISOString() } : tank,
      )

      const selectedTank =
        state.selectedTank && state.selectedTank.id === payload.id
          ? {
              ...state.selectedTank,
              ...payload,
              lastUpdatedAt: new Date().toISOString(),
              history:
                payload.temperature !== undefined
                  ? [
                      ...state.selectedTank.history.slice(-47),
                      { timestamp: new Date().toISOString(), value: payload.temperature },
                    ]
                  : state.selectedTank.history,
            }
          : state.selectedTank

      return { tanks, selectedTank }
    })
  },

  setSetpoint: async (id, setpoint) => {
    const updated = await updateTankSetpoint(id, setpoint)
    if (!updated) return
    set((state) => ({
      tanks: state.tanks.map((tank) => (tank.id === id ? { ...tank, ...updated } : tank)),
      selectedTank: state.selectedTank?.id === id ? { ...state.selectedTank, ...updated } : state.selectedTank,
    }))
  },

  toggleRunning: async (id, isRunning) => {
    const updated = await toggleTank(id, isRunning)
    if (!updated) return
    set((state) => ({
      tanks: state.tanks.map((tank) => (tank.id === id ? { ...tank, ...updated } : tank)),
      selectedTank: state.selectedTank?.id === id ? { ...state.selectedTank, ...updated } : state.selectedTank,
    }))
  },

  updateContents: async (id, contents) => {
    const updated = await updateTankContents(id, contents)
    if (!updated) return
    set((state) => ({
      tanks: state.tanks.map((tank) => (tank.id === id ? { ...tank, ...updated } : tank)),
      selectedTank: state.selectedTank?.id === id ? { ...state.selectedTank, ...updated } : state.selectedTank,
    }))
  },
}))

