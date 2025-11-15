import { create } from 'zustand'
import { type Alarm, type Tank, type TankContents, type TemperatureReading } from '../types'
import {
  acknowledgeAlarm,
  fetchAlarms,
  fetchTankByIx,
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
  selectTank: (ix: number) => Promise<void>
  applyTelemetry: (payload: Partial<Tank> & { ix: number }) => void
  setSetpoint: (ix: number, setpoint: number) => Promise<void>
  toggleRunning: (ix: number, isRunning: boolean) => Promise<void>
  updateContents: (ix: number, contents: TankContents) => Promise<void>
  acknowledgeAlarm: (id: string) => Promise<void>
}

export const useTankStore = create<TankState>((set, get) => ({
  tanks: [],
  alarms: [],
  loading: true,
  selectedTank: undefined,
  selectedTankLoading: false,

  initialize: async () => {
    set({ loading: true })
    try {
      const [tanks, alarms] = await Promise.all([fetchTanks(), fetchAlarms()])
      // Toujours mettre à jour, même si la liste est vide (pour vider les anciennes cuves)
      set({ tanks, alarms, loading: false, selectedTank: undefined })
    } catch (error) {
      console.error('[TankStore] Impossible de charger les données', error)
      // En cas d'erreur, vider aussi les cuves pour éviter d'afficher des données obsolètes
      set({ tanks: [], alarms: [], loading: false, selectedTank: undefined })
    }
  },

  selectTank: async (ix: number) => {
    set({ selectedTankLoading: true })
    try {
      const [remoteTank, remoteHistory] = await Promise.all([
        fetchTankByIx(ix).catch((error) => {
          console.warn('[TankStore] Tank distant indisponible', ix, error)
          return undefined
        }),
        fetchTankHistory(ix).catch((error) => {
          console.warn('[TankStore] Historique indisponible', ix, error)
          return undefined
        }),
      ])

      const localTank = get().tanks.find((item: Tank) => item.ix === ix)
      const tank = remoteTank ?? localTank

      if (!tank || tank.isDeleted) {
        throw new Error('[TankStore] Cuve inconnue')
      }

      const history: TemperatureReading[] =
        remoteHistory ?? remoteTank?.history ?? localTank?.history ?? []

      set({ selectedTank: { ...tank, history } })
    } finally {
      set({ selectedTankLoading: false })
    }
  },

  applyTelemetry: (payload) => {
    console.log('[TankStore] applyTelemetry appelée pour cuve', payload.ix, 'payload:', payload)
    set((state) => {
      const tanks = state.tanks
        .map((tank) => {
          if (tank.ix === payload.ix) {
            const updated = { ...tank, ...payload, lastUpdatedAt: payload.lastUpdatedAt ?? new Date().toISOString() }
            console.log('[TankStore] Cuve mise à jour:', updated.ix, 'temp:', updated.temperature)
            return updated
          }
          return tank
        })
        .filter((tank) => !tank.isDeleted)

      const selectedTank =
        state.selectedTank && state.selectedTank.ix === payload.ix
          ? {
              ...state.selectedTank,
              ...payload,
              lastUpdatedAt: payload.lastUpdatedAt ?? new Date().toISOString(),
              history:
                payload.history ??
                (payload.temperature !== undefined
                  ? [
                      ...state.selectedTank.history.slice(-47),
                      { timestamp: new Date().toISOString(), value: payload.temperature },
                    ]
                  : state.selectedTank.history),
            }
          : state.selectedTank
      
      if (selectedTank && selectedTank.ix === payload.ix) {
        console.log('[TankStore] SelectedTank mise à jour:', selectedTank.ix, 'temp:', selectedTank.temperature)
      }

      if (selectedTank?.isDeleted) {
        return { tanks, selectedTank: undefined }
      }

      console.log('[TankStore] État mis à jour, tanks:', tanks.length, 'selectedTank:', selectedTank?.ix)
      return { tanks, selectedTank }
    })
  },

  setSetpoint: async (ix, setpoint) => {
    try {
      const updated = await updateTankSetpoint(ix, setpoint)
      if (!updated) return
      set((state) => ({
        tanks: state.tanks.map((tank) => (tank.ix === ix ? { ...tank, ...updated } : tank)),
        selectedTank: state.selectedTank?.ix === ix ? { ...state.selectedTank, ...updated } : state.selectedTank,
      }))
    } catch (error) {
      console.error('[TankStore] Impossible de mettre à jour la consigne', error)
    }
  },

  toggleRunning: async (ix, isRunning) => {
    try {
      const updated = await toggleTank(ix, isRunning)
      if (!updated) return
      set((state) => ({
        tanks: state.tanks.map((tank) => (tank.ix === ix ? { ...tank, ...updated } : tank)),
        selectedTank: state.selectedTank?.ix === ix ? { ...state.selectedTank, ...updated } : state.selectedTank,
      }))
    } catch (error) {
      console.error('[TankStore] Impossible de changer l’état de la cuve', error)
    }
  },

  updateContents: async (ix, contents) => {
    try {
      const updated = await updateTankContents(ix, contents)
      if (!updated) return
      set((state) => ({
        tanks: state.tanks.map((tank) => (tank.ix === ix ? { ...tank, ...updated } : tank)),
        selectedTank: state.selectedTank?.ix === ix ? { ...state.selectedTank, ...updated } : state.selectedTank,
      }))
    } catch (error) {
      console.error('[TankStore] Impossible de mettre à jour le contenu', error)
    }
  },

  acknowledgeAlarm: async (id: string) => {
    try {
      const updated = await acknowledgeAlarm(id)
      if (!updated) return
      set((state) => ({
        alarms: state.alarms.map((alarm) => (alarm.id === id ? { ...alarm, ...updated } : alarm)),
      }))
    } catch (error) {
      console.error('[TankStore] Impossible d’acquitter l’alarme', error)
    }
  },
}))

