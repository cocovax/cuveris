import { getDataContext } from '../data/dataContext'
import { type CuverieConfig } from '../domain/config'

const ctx = () => getDataContext()

export const configRepository = {
  list: () => ctx().cuveries.list(),
  upsert: (cuverie: CuverieConfig) => ctx().cuveries.upsert(cuverie),
  deleteById: (id: string) => ctx().cuveries.deleteById(id),
}

