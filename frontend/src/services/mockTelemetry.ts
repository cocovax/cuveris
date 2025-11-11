import { type Tank } from '../types'

type TelemetryEmitter = (payload: Partial<Tank> & { ix: number; id?: string }) => void

interface MockTelemetryOptions {
  intervalMs?: number
  tankIxs?: number[]
}

const DEFAULT_IXS = [101, 102, 103]

let timer: ReturnType<typeof setInterval> | undefined

export function startMockTelemetry(emitter: TelemetryEmitter, options: MockTelemetryOptions = {}) {
  stopMockTelemetry()
  const { intervalMs = 5000, tankIxs = DEFAULT_IXS } = options

  timer = setInterval(() => {
    const tankIx = tankIxs[Math.floor(Math.random() * tankIxs.length)]
    const base = 20 + Math.random() * 5
    const temperature = Number((base + (Math.random() - 0.5)).toFixed(2))

    emitter({
      ix: tankIx,
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

