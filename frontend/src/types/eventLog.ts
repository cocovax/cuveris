export type EventCategory = 'command' | 'telemetry' | 'alarm'

export interface EventLogEntry {
  id: string
  timestamp: string
  tankIx?: number
  category: EventCategory
  source: 'user' | 'system' | 'backend'
  summary: string
  details?: string
  metadata?: Record<string, unknown>
}

