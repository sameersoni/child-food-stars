import { NavLink, Outlet } from 'react-router-dom'

const nav = [
  { to: '/plan', label: 'Plan', emoji: '📅' },
  { to: '/stars', label: 'Stars', emoji: '⭐' },
  { to: '/analytics', label: 'Parents', emoji: '📊' },
]

export function AppShell() {
  return (
    <div className="min-h-dvh pb-24 font-[Nunito]">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-40 h-8 bg-gradient-to-b from-white/70 to-transparent" />
      <Outlet />
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/50 bg-white/85 px-2 py-2 backdrop-blur-xl pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="mx-auto flex max-w-lg justify-around gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex min-h-[52px] min-w-[72px] flex-1 flex-col items-center justify-center rounded-2xl text-xs font-extrabold transition ${
                  isActive ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-600'
                }`
              }
            >
              <span className="text-xl">{item.emoji}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
