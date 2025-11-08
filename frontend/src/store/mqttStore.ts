import { create } from 'zustand'
import { determineGatewayMode, type MqttGatewayMode } from '../config/mqtt'

export type MqttStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

interface MqttState {
  status: MqttStatus
  mode: MqttGatewayMode
  lastMessageAt?: Date
  messageIntervalMs?: number
  error?: string
  setStatus: (status: MqttStatus) => void
  setMode: (mode: MqttGatewayMode) => void
  setError: (error?: string) => void
  recordMessage: () => void
  reset: () => void
}

export const useMqttStore = create<MqttState>((set) => ({
  status: 'disconnected',
  mode: determineGatewayMode(),
  lastMessageAt: undefined,
  messageIntervalMs: undefined,
  error: undefined,
  setStatus: (status) =>
    set(() => ({
      status,
      ...(status !== 'error' ? { error: undefined } : {}),
    })),
  setMode: (mode) => set({ mode }),
  setError: (error) =>
    set((state) => ({
      error,
      status: error ? 'error' : state.status === 'error' ? 'disconnected' : state.status,
    })),
  recordMessage: () =>
    set((state) => {
      const now = new Date()
      const previous = state.lastMessageAt?.getTime()
      const messageIntervalMs = previous ? now.getTime() - previous : undefined
      return {
        lastMessageAt: now,
        messageIntervalMs,
        status: state.status === 'error' ? 'connected' : state.status,
      }
    }),
  reset: () =>
    set({
      status: 'disconnected',
      lastMessageAt: undefined,
      messageIntervalMs: undefined,
      error: undefined,
    }),
}))

