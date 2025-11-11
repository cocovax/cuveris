import { create } from 'zustand'
import { type CuverieConfig, type GeneralMode } from '../types'
import { fetchConfig, setCuverieMode } from '../services/api'

interface ConfigState {
  cuveries: CuverieConfig[]
  loading: boolean
  load: (force?: boolean) => Promise<void>
  updateMode: (cuverieId: string, mode: GeneralMode) => Promise<void>
  applyUpdate: (cuveries: CuverieConfig[]) => void
}

const normalizeCuverie = (cuverie: CuverieConfig): CuverieConfig => {
  const name = cuverie.name.trim()
  if (name.toLowerCase() === 'default') {
    return { ...cuverie, name: 'Cuverie' }
  }
  return cuverie
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  cuveries: [],
  loading: false,
  load: async (force = false) => {
    if (get().loading && !force) return
    set({ loading: true })
    try {
      const cuveries = await fetchConfig()
      set({ cuveries: cuveries.map(normalizeCuverie), loading: false })
    } catch (error) {
      console.error('[ConfigStore] Impossible de charger la configuration', error)
      set({ loading: false })
    }
  },
  updateMode: async (cuverieId, mode) => {
    const result = await setCuverieMode(cuverieId, mode)
    if (!result) return
    set((state) => ({
      cuveries: state.cuveries.map((cuverie) =>
        cuverie.id === cuverieId ? { ...cuverie, mode: result } : cuverie,
      ),
    }))
  },
  applyUpdate: (cuveries) => set({ cuveries: cuveries.map(normalizeCuverie), loading: false }),
}))

