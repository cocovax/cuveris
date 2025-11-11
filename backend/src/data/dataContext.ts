import { createInMemoryDataContext } from './providers/inMemory'
import { createPostgresAdapters, type PostgresProviderConfig } from './providers/postgres'
import { type DataContext } from './interfaces'
import { env } from '../config/env'

let context: DataContext | undefined
export let postgresAdapters: ReturnType<typeof createPostgresAdapters> | undefined

const initializeContext = () => {
  context = createInMemoryDataContext()
  if (env.data.provider === 'postgres' && env.data.databaseUrl) {
    try {
      const config: PostgresProviderConfig = {
        eventConnectionString: env.data.databaseUrl,
        statementTimeoutMs: 5000,
      }
      if (env.data.timeseriesUrl) {
        config.timeseriesConnectionString = env.data.timeseriesUrl
      }
      postgresAdapters = createPostgresAdapters(config)
      console.info('[Data] Adaptateur PostgreSQL initialisé')
    } catch (error) {
      console.error('[Data] Impossible d’initialiser l’adaptateur PostgreSQL', error)
      postgresAdapters = undefined
    }
  }
  return context
}

export const getDataContext = (): DataContext => {
  if (!context) {
    return initializeContext()
  }
  return context
}

export const resetDataContext = () => {
  initializeContext()
}
