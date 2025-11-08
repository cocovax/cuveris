import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { type TemperatureReading } from '../../types'

interface TemperatureChartProps {
  data: TemperatureReading[]
  setpoint: number
}

export function TemperatureChart({ data, setpoint }: TemperatureChartProps) {
  const formatted = data.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    temperature: point.value,
  }))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">Historique 24h</p>
          <p className="text-xs text-slate-400">Réactualisé en temps réel</p>
        </div>
        <div className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          Consigne {setpoint.toFixed(1)}°C
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="temperature" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 8" stroke="#E2E8F0" />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={12} />
            <YAxis stroke="#94A3B8" fontSize={12} />
            <Tooltip
              contentStyle={{ borderRadius: 12, borderColor: '#E2E8F0' }}
              labelClassName="text-slate-500"
              formatter={(value: number) => `${value.toFixed(1)}°C`}
            />
            <ReferenceLine y={setpoint} stroke="#F59E0B" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="temperature" stroke="#7C3AED" fill="url(#temperature)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

