import { NavLink } from 'react-router-dom'
import { useTankStore } from '../../store/tankStore'
import { MQTTConnectionIndicator } from '../mq/MQTTConnectionIndicator'
import { useConfigStore } from '../../store/configStore'

const staticItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/alarmes', label: 'Alarmes' },
  { to: '/historique', label: 'Historique' },
  { to: '/reglages', label: 'Réglages' },
]

export function Sidebar() {
  const tankCount = useTankStore((state) => state.tanks.length)
  const cuveries = useConfigStore((state) => state.cuveries)

  return (
    <aside className="hidden w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 lg:flex">
      <div>
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-semibold">
            CV
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Cuverie Pilotage</p>
            <p className="text-sm text-slate-500">{tankCount} cuves suivies</p>
          </div>
        </div>
        <nav className="space-y-2">
          {staticItems.slice(0, 1).map((item) => (
            <SidebarLink key={item.to} to={item.to} label={item.label} />
          ))}
          {cuveries.map((cuverie) => (
            <SidebarLink key={cuverie.id} to={`/cuveries/${cuverie.id}`} label={cuverie.name} />
          ))}
          {staticItems.slice(1).map((item) => (
            <SidebarLink key={item.to} to={item.to} label={item.label} />
          ))}
        </nav>
      </div>
      <MQTTConnectionIndicator />
    </aside>
  )
}

interface SidebarLinkProps {
  to: string
  label: string
}

function SidebarLink({ to, label }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

