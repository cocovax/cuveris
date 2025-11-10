import { NavLink } from 'react-router-dom'
import { useConfigStore } from '../../store/configStore'

const staticItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/alarmes', label: 'Alarmes' },
  { to: '/historique', label: 'Historique' },
  { to: '/reglages', label: 'Réglages' },
]

export function MobileNav() {
  const cuveries = useConfigStore((state) => state.cuveries)
  const items = [
    staticItems[0],
    ...cuveries.map((cuverie) => ({ to: `/cuveries/${cuverie.id}`, label: cuverie.name })),
    ...staticItems.slice(1),
  ]

  return (
    <nav className="fixed bottom-4 left-1/2 z-20 flex w-[92%] max-w-lg -translate-x-1/2 items-center justify-around rounded-full border border-slate-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-1 items-center justify-center rounded-full px-3 py-2 text-xs font-semibold transition ${
              isActive ? 'bg-primary text-white shadow' : 'text-slate-500 hover:bg-slate-100'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

