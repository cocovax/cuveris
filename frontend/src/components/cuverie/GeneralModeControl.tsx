import { type ComponentType } from 'react'
import { type GeneralMode } from '../../types'
import { useConfigStore } from '../../store/configStore'
import { SnowflakeIcon, SunIcon, StopIcon } from '../ui/icons/ModeIcons'

const modes: Array<{
  value: GeneralMode
  label: string
  description: string
  Icon: ComponentType<{ className?: string }>
}> = [
  { value: 'CHAUD', label: 'Chaud', description: 'Active le chauffage global de la cuverie', Icon: SunIcon },
  { value: 'FROID', label: 'Froid', description: 'Active le refroidissement global de la cuverie', Icon: SnowflakeIcon },
  { value: 'ARRET', label: 'Arrêt', description: 'Désactive toutes les régulations', Icon: StopIcon },
]

interface GeneralModeControlProps {
  cuverieId: string
  currentMode: GeneralMode
}

export function GeneralModeControl({ cuverieId, currentMode }: GeneralModeControlProps) {
  const updateMode = useConfigStore((state) => state.updateMode)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Mode général</h3>
      <p className="text-sm text-slate-500">
        Pilotez le mode global de la cuverie. La commande est diffusée sur le topic MQTT{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-600">global/prod/&lt;cuverie&gt;/mode</code>.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {modes.map((mode) => {
          const active = currentMode === mode.value
          const iconClass = active
            ? 'text-white'
            : mode.value === 'FROID'
              ? 'text-sky-600'
              : mode.value === 'ARRET'
                ? 'text-slate-500'
                : 'text-amber-600'
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => updateMode(cuverieId, mode.value)}
              disabled={active}
              className={`rounded-xl border px-3 py-3 text-left transition ${
                active
                  ? 'border-primary bg-primary text-white shadow'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-primary/40 hover:bg-white'
              } ${active ? 'cursor-default' : ''}`}
            >
              <mode.Icon className={`mb-2 h-5 w-5 ${iconClass}`} />
              <p className="text-sm font-semibold">{mode.label}</p>
              <p className={`mt-1 text-xs ${active ? 'text-white/80' : 'text-slate-500'}`}>{mode.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

