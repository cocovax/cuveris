export type GeneralMode = 'CHAUD' | 'FROID' | 'ARRET'

export interface TankConfig {
  id: string
  ix: number
  displayName: string
  order: number
}

export interface CuverieConfig {
  id: string
  name: string
  tanks: TankConfig[]
  mode: GeneralMode
}

