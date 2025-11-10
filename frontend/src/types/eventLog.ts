export type EventCategory = 'command' | 'telemetry' | 'alarm'

export interface EventLogEntry {
  id: string
  timestamp: string
  tankId?: string
  category: EventCategory
  source: 'user' | 'system' | 'backend'
  summary: string
  details?: string
  metadata?: Record<string, unknown>
}

