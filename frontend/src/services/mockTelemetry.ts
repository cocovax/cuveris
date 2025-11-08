import { type Tank } from '../types'

type TelemetryEmitter = (payload: Partial<Tank> & { id: string }) => void

interface MockTelemetryOptions {
  intervalMs?: number
  tankIds?: string[]
}

const DEFAULT_IDS = ['tank-01', 'tank-02', 'tank-03']

let timer: ReturnType<typeof setInterval> | undefined

export function startMockTelemetry(emitter: TelemetryEmitter, options: MockTelemetryOptions = {}) {
  stopMockTelemetry()
  const { intervalMs = 5000, tankIds = DEFAULT_IDS } = options

  timer = setInterval(() => {
    const tankId = tankIds[Math.floor(Math.random() * tankIds.length)]
    const base = 20 + Math.random() * 5
    const temperature = Number((base + (Math.random() - 0.5)).toFixed(2))

    emitter({
      id: tankId,
      temperature,
      lastUpdatedAt: new Date().toISOString(),
    })
  }, intervalMs)
}

export function stopMockTelemetry() {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}

