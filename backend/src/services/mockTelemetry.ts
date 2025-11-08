import { type Tank } from '../domain/models'

type TelemetryEmitter = (payload: Partial<Tank> & { id: string }) => void

interface MockOptions {
  intervalMs?: number
  tankIds?: string[]
}

const DEFAULT_TANKS: [string, ...string[]] = ['tank-01', 'tank-02', 'tank-03']

let timer: NodeJS.Timeout | undefined

export const startMockTelemetry = (emit: TelemetryEmitter, options: MockOptions = {}) => {
  stopMockTelemetry()
  const intervalMs = options.intervalMs ?? 5000
  const tankList = options.tankIds && options.tankIds.length > 0 ? options.tankIds : DEFAULT_TANKS

  timer = setInterval(() => {
    const index = Math.floor(Math.random() * tankList.length)
    const candidate = tankList[index]
    const tankId = candidate ?? DEFAULT_TANKS[0]
    const base = 20 + Math.random() * 5
    const temperature = Number((base + (Math.random() - 0.5)).toFixed(2))
    emit({
      id: tankId,
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

