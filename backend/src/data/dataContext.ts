import { createInMemoryDataContext } from './providers/inMemory'
import { type DataContext } from './interfaces'

let context: DataContext | undefined

export const getDataContext = (): DataContext => {
  if (!context) {
    context = createInMemoryDataContext()
  }
  return context
}

export const resetDataContext = () => {
  context = createInMemoryDataContext()
}

