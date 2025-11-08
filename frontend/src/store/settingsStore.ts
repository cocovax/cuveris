import { create } from 'zustand'
import { type AlarmThresholds, type SettingsState, type TemperatureUnit } from '../types'

interface SettingsStore extends SettingsState {
  updateThresholds: (thresholds: AlarmThresholds) => void
  updateTemperatureUnit: (unit: TemperatureUnit) => void
  updateTheme: (theme: SettingsState['preferences']['theme']) => void
}

const defaultState: SettingsState = {
  alarmThresholds: {
    high: 26,
    low: 16,
  },
  preferences: {
    locale: 'fr-FR',
    temperatureUnit: 'C',
    theme: 'auto',
  },
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...defaultState,

  updateThresholds: (thresholds) => set({ alarmThresholds: thresholds }),

  updateTemperatureUnit: (unit) =>
    set((state) => ({
      alarmThresholds:
        unit === state.preferences.temperatureUnit
          ? state.alarmThresholds
          : convertThresholds(state.alarmThresholds, unit),
      preferences: {
        ...state.preferences,
        temperatureUnit: unit,
      },
    })),

  updateTheme: (theme) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        theme,
      },
    })),
}))

function convertThresholds(thresholds: AlarmThresholds, targetUnit: TemperatureUnit): AlarmThresholds {
  if (targetUnit === 'C') {
    return {
      high: toCelsius(thresholds.high),
      low: toCelsius(thresholds.low),
    }
  }
  return {
    high: toFahrenheit(thresholds.high),
    low: toFahrenheit(thresholds.low),
  }
}

const toFahrenheit = (value: number) => Number((value * 9) / 5 + 32)
const toCelsius = (value: number) => Number(((value - 32) * 5) / 9)

