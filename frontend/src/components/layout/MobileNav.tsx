import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/alarmes', label: 'Alarmes' },
  { to: '/reglages', label: 'Réglages' },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-20 flex w-[92%] max-w-md -translate-x-1/2 items-center justify-around rounded-full border border-slate-200 bg-white/95 px-2 py-2 shadow-lg backdrop-blur lg:hidden">
      {navItems.map((item) => (
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

