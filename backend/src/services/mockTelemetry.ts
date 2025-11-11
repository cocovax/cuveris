import { type Tank } from '../domain/models'

type TelemetryEmitter = (payload: Partial<Tank> & { ix: number; id?: string }) => void

interface MockOptions {
  intervalMs?: number
  tankIxs?: number[]
}

const DEFAULT_TANKS: [number, ...number[]] = [101, 102, 103]

let timer: NodeJS.Timeout | undefined

export const startMockTelemetry = (emit: TelemetryEmitter, options: MockOptions = {}) => {
  stopMockTelemetry()
  const intervalMs = options.intervalMs ?? 5000
  const tankList = options.tankIxs && options.tankIxs.length > 0 ? options.tankIxs : DEFAULT_TANKS

  timer = setInterval(() => {
    const index = Math.floor(Math.random() * tankList.length)
    const candidate = tankList[index]
    const tankIx = candidate ?? DEFAULT_TANKS[0]
    const base = 20 + Math.random() * 5
    const temperature = Number((base + (Math.random() - 0.5)).toFixed(2))
    emit({
      ix: tankIx,
      temperature,
      lastUpdatedAt: new Date().toISOString(),
    })
  }, intervalMs)
}

export const stopMockTelemetry = () => {
  if (timer) {
    clearInterval(timer)
    timer = undefined
  }
}

