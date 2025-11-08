import { type Alarm, type Tank, type TankContents, type TemperatureReading } from '../types'

const MOCK_TANKS: Tank[] = [
  {
    id: 'tank-01',
    name: 'Cuve 01',
    status: 'cooling',
    temperature: 18.4,
    setpoint: 18.0,
    capacityLiters: 5000,
    fillLevelPercent: 72,
    contents: { grape: 'Chardonnay', vintage: 2024, volumeLiters: 3600 },
    lastUpdatedAt: new Date().toISOString(),
    isRunning: true,
    alarms: [],
    history: generateHistory(18, 19.4),
  },
  {
    id: 'tank-02',
    name: 'Cuve 02',
    status: 'idle',
    temperature: 21.1,
    setpoint: 21.0,
    capacityLiters: 6000,
    fillLevelPercent: 55,
    contents: { grape: 'Sauvignon', vintage: 2023, volumeLiters: 3300 },
    lastUpdatedAt: new Date().toISOString(),
    isRunning: false,
    alarms: [],
    history: generateHistory(20.5, 22),
  },
  {
    id: 'tank-03',
    name: 'Cuve 03',
    status: 'alarm',
    temperature: 25.8,
    setpoint: 23.0,
    capacityLiters: 4500,
    fillLevelPercent: 91,
    contents: { grape: 'Merlot', vintage: 2024, volumeLiters: 4095 },
    lastUpdatedAt: new Date().toISOString(),
    isRunning: true,
    alarms: ['Température haute'],
    history: generateHistory(22.5, 26.2),
  },
]

const MOCK_ALARMS: Alarm[] = [
  {
    id: 'alarm-001',
    tankId: 'tank-03',
    message: 'Température supérieure au seuil haut (+2.8°C)',
    severity: 'critical',
    triggeredAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    acknowledged: false,
  },
]

function generateHistory(min: number, max: number, points = 48): TemperatureReading[] {
  const data: TemperatureReading[] = []
  const now = Date.now()
  for (let i = points - 1; i >= 0; i -= 1) {
    const timestamp = new Date(now - i * 30 * 60 * 1000).toISOString()
    const value = Number((min + Math.random() * (max - min)).toFixed(2))
    data.push({ timestamp, value })
  }
  return data
}

const simulateNetwork = async (ms = 400) => {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchTanks(): Promise<Tank[]> {
  await simulateNetwork()
  return structuredClone(MOCK_TANKS)
}

export async function fetchTankById(id: string): Promise<Tank | undefined> {
  await simulateNetwork()
  return structuredClone(MOCK_TANKS.find((tank) => tank.id === id))
}

export async function updateTankSetpoint(id: string, setpoint: number): Promise<Tank | undefined> {
  await simulateNetwork(250)
  const tank = MOCK_TANKS.find((item) => item.id === id)
  if (!tank) return undefined
  tank.setpoint = setpoint
  tank.lastUpdatedAt = new Date().toISOString()
  return structuredClone(tank)
}

export async function toggleTank(id: string, isRunning: boolean): Promise<Tank | undefined> {
  await simulateNetwork(250)
  const tank = MOCK_TANKS.find((item) => item.id === id)
  if (!tank) return undefined
  tank.isRunning = isRunning
  tank.status = isRunning ? 'cooling' : 'idle'
  tank.lastUpdatedAt = new Date().toISOString()
  return structuredClone(tank)
}

export async function fetchAlarms(): Promise<Alarm[]> {
  await simulateNetwork()
  return structuredClone(MOCK_ALARMS)
}

export async function fetchTankHistory(id: string): Promise<TemperatureReading[]> {
  await simulateNetwork()
  const tank = MOCK_TANKS.find((item) => item.id === id)
  return structuredClone(tank?.history ?? [])
}

export async function updateTankContents(id: string, contents: TankContents): Promise<Tank | undefined> {
  await simulateNetwork(250)
  const tank = MOCK_TANKS.find((item) => item.id === id)
  if (!tank) return undefined
  tank.contents = { ...contents }
  tank.lastUpdatedAt = new Date().toISOString()
  return structuredClone(tank)
}

