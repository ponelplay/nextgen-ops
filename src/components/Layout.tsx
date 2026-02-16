import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CalendarDays,
  Plane,
  CheckSquare,
  ChevronDown,
  LogOut,
} from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Today' },
  { to: '/games', icon: CalendarDays, label: 'Games' },
  { to: '/people', icon: UserCircle, label: 'People' },
  { to: '/contacts', icon: Users, label: 'Contacts' },
  { to: '/flights', icon: Plane, label: 'Flights' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
]

export function Layout() {
  const { tournament, tournaments, setTournamentId } = useTournament()
  const { signOut } = useAuth()
  const [showPicker, setShowPicker] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-full flex-col bg-ng-bg">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-ng-border bg-ng-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-lg font-black tracking-tight text-ng-green">NEXTGEN</span>
            <span className="text-lg font-light text-ng-text">ops</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1 rounded-lg bg-ng-card px-3 py-1.5 text-sm text-ng-text"
          >
            {tournament.city}
            <ChevronDown size={14} />
          </button>
          <button
            onClick={signOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ng-text-dim hover:text-ng-text"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Tournament Picker Dropdown */}
      {showPicker && (
        <div className="absolute right-4 top-14 z-50 overflow-hidden rounded-lg border border-ng-border bg-ng-surface shadow-xl">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTournamentId(t.id)
                setShowPicker(false)
              }}
              className={`block w-full px-4 py-3 text-left text-sm hover:bg-ng-card ${
                t.id === tournament.id ? 'text-ng-green' : 'text-ng-text'
              }`}
            >
              <div className="font-medium">{t.name}</div>
              <div className="text-xs text-ng-text-dim">
                {t.city} · {t.startDate}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="safe-bottom flex border-t border-ng-border bg-ng-surface">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={() => {
              const isActive =
                to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(to)
              return `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'text-ng-green' : 'text-ng-text-dim'
              }`
            }}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
