import { create } from 'zustand'

type MqttStatus = 'disconnected' | 'connecting' | 'connected'

interface MqttState {
  status: MqttStatus
  lastMessageAt?: Date
  setStatus: (status: MqttStatus) => void
  touch: () => void
}

export const useMqttStore = create<MqttState>((set) => ({
  status: 'disconnected',
  lastMessageAt: undefined,
  setStatus: (status) => set({ status }),
  touch: () => set({ lastMessageAt: new Date() }),
}))

