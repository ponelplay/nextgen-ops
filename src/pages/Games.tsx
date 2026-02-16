import { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useGames } from '../hooks/useGames'
import { GameCard } from '../components/GameCard'
import { formatLocalDate, formatDisplayDate } from '../utils/time'
import { ABU_DHABI_KNOCKOUTS, type KnockoutSlot } from '../data/tournaments'
import type { ApiGame } from '../types'

export function Games() {
  const { tournament } = useTournament()
  const { data: games, isLoading, error } = useGames(tournament.seasonCode)
  const [groupFilter, setGroupFilter] = useState<string | null>(null)

  // Check if API already has knockout games for a given date
  const apiHasGamesOnDate = (date: string) =>
    games?.some((g) => formatLocalDate(g.utcDate, tournament.timezone) === date) || false

  // Get knockout slots for this tournament (only Abu Dhabi for now)
  const knockoutSlots = tournament.id === 'abu-dhabi-2026' ? ABU_DHABI_KNOCKOUTS : []

  // Knockout dates that DON'T have API games yet (show placeholders)
  const knockoutDatesWithoutApi = useMemo(() => {
    const dates = new Set(knockoutSlots.map((k) => k.date))
    return Array.from(dates).filter((d) => !apiHasGamesOnDate(d))
  }, [knockoutSlots, games, tournament.timezone])

  const gamesByDate = useMemo(() => {
    if (!games) return new Map<string, ApiGame[]>()
    const filtered = groupFilter
      ? games.filter((g) => g.group.rawName === groupFilter)
      : games
    // Group by date
    const obj: Record<string, ApiGame[]> = {}
    for (const game of filtered) {
      const dateKey = formatLocalDate(game.utcDate, tournament.timezone)
      if (!obj[dateKey]) obj[dateKey] = []
      obj[dateKey].push(game)
    }
    // Sort dates chronologically (earliest first), then games within each date by UTC time
    const sortedDates = Object.keys(obj).sort()
    const map = new Map<string, ApiGame[]>()
    for (const date of sortedDates) {
      obj[date].sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
      map.set(date, obj[date])
    }
    return map
  }, [games, groupFilter, tournament.timezone])

  const groups = useMemo(() => {
    if (!games) return []
    const set = new Set(games.map((g) => g.group.rawName))
    return Array.from(set).sort()
  }, [games])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading schedule...
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-400">
        Failed to load games. Pull down to retry.
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Game Schedule</h1>
        <div className="flex gap-1">
          <FilterBtn
            label="All"
            active={groupFilter === null}
            onClick={() => setGroupFilter(null)}
          />
          {groups.map((g) => (
            <FilterBtn
              key={g}
              label={`Grp ${g}`}
              active={groupFilter === g}
              onClick={() => setGroupFilter(g)}
            />
          ))}
        </div>
      </div>

      {/* API games by date */}
      {Array.from(gamesByDate.entries()).map(([date, dayGames]) => (
        <div key={date} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-ng-green">
            {formatDisplayDate(date)}
          </h2>
          <div className="space-y-3">
            {dayGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      ))}

      {/* Knockout placeholder slots (only shown when API doesn't have them yet) */}
      {!groupFilter &&
        knockoutDatesWithoutApi.map((date) => (
          <div key={`ko-${date}`} className="mb-6">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ng-green">
              <Trophy size={14} />
              {formatDisplayDate(date)} — Knockouts
            </h2>
            <div className="space-y-2">
              {knockoutSlots
                .filter((k) => k.date === date)
                .map((slot) => (
                  <KnockoutPlaceholder key={slot.label} slot={slot} />
                ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Matchups will appear automatically after group stage (Sat ~22:45 local)
            </p>
          </div>
        ))}

      {gamesByDate.size === 0 && knockoutDatesWithoutApi.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          No games found for this tournament yet.
        </div>
      )}
    </div>
  )
}

function KnockoutPlaceholder({ slot }: { slot: KnockoutSlot }) {
  const isFinal = slot.label.toLowerCase().includes('final')
  return (
    <div
      className={`rounded-xl border p-4 ${
        isFinal
          ? 'border-ng-green/50 bg-ng-green/10'
          : 'border-ng-border bg-ng-card'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-400">{slot.venue}</div>
          <div className={`text-sm font-semibold ${isFinal ? 'text-ng-green' : 'text-white'}`}>
            {slot.label}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${isFinal ? 'text-ng-green' : 'text-white'}`}>
            {slot.localTime}
          </div>
          <div className="text-xs text-slate-400">Local Time</div>
        </div>
      </div>
      <div className="mt-2 text-center text-xs text-slate-500">
        TBD vs TBD
      </div>
    </div>
  )
}

function FilterBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1 text-xs font-medium ${
        active ? 'bg-ng-green text-white' : 'bg-ng-card text-slate-400'
      }`}
    >
      {label}
    </button>
  )
}
