import { useMemo } from 'react'
import { format, parseISO, addDays } from 'date-fns'
import { Clock, MapPin, AlertCircle } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useGames } from '../hooks/useGames'
import { useSupabaseData } from '../hooks/useSupabaseData'
import { GameCard } from '../components/GameCard'
import { formatLocalDate } from '../utils/time'
import type { Transfer, Task, DailyEvent } from '../types'

export function Dashboard() {
  const { tournament } = useTournament()
  const { data: games, isLoading } = useGames(tournament.seasonCode)
  const { items: transfers } = useSupabaseData<Transfer>('transfers', tournament.id)
  const { items: tasks } = useSupabaseData<Task>('tasks', tournament.id)
  const { items: events } = useSupabaseData<DailyEvent>('daily_events', tournament.id)

  // Figure out "today" in tournament local timezone
  const now = new Date()
  const localNow = new Date(now.getTime() + tournament.timezone * 60 * 60 * 1000)
  const todayStr = format(localNow, 'yyyy-MM-dd')
  const tomorrowStr = format(addDays(localNow, 1), 'yyyy-MM-dd')

  const todaysGames = useMemo(() => {
    if (!games) return []
    return games
      .filter((g) => formatLocalDate(g.utcDate, tournament.timezone) === todayStr)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
  }, [games, todayStr, tournament.timezone])

  const tomorrowsGames = useMemo(() => {
    if (!games) return []
    return games
      .filter((g) => formatLocalDate(g.utcDate, tournament.timezone) === tomorrowStr)
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
  }, [games, tomorrowStr, tournament.timezone])

  const todaysTransfers = transfers
    .filter((t) => t.date === todayStr)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
  const pendingTasks = tasks.filter((t) => !t.completed).slice(0, 5)
  const todaysEvents = events.filter((e) => e.date === todayStr)

  const daysUntilStart = Math.ceil(
    (parseISO(tournament.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="space-y-4 p-4">
      {/* Tournament header */}
      <div className="rounded-xl border border-ng-border bg-ng-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{tournament.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
              <MapPin size={14} />
              <span>{tournament.venue} · {tournament.city}</span>
            </div>
          </div>
          {daysUntilStart > 0 ? (
            <div className="text-right">
              <div className="text-2xl font-bold text-ng-green">{daysUntilStart}</div>
              <div className="text-xs text-slate-400">days to go</div>
            </div>
          ) : (
            <div className="rounded-lg bg-green-600/20 px-3 py-1 text-sm font-semibold text-green-400">
              LIVE
            </div>
          )}
        </div>
      </div>

      {/* Urgent tasks */}
      {pendingTasks.filter((t) => t.priority === 'urgent').length > 0 && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-400">
            <AlertCircle size={16} />
            Urgent Tasks
          </div>
          {pendingTasks
            .filter((t) => t.priority === 'urgent')
            .map((t) => (
              <div key={t.id} className="text-sm text-red-300">
                {t.title}
              </div>
            ))}
        </div>
      )}

      {/* Today's Games */}
      <Section title="Today's Games" count={todaysGames.length}>
        {isLoading ? (
          <div className="py-4 text-center text-sm text-slate-500">Loading games...</div>
        ) : todaysGames.length > 0 ? (
          <div className="space-y-2">
            {todaysGames.map((g) => (
              <GameCard key={g.id} game={g} compact />
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-slate-500">No games today</div>
        )}
      </Section>

      {/* Tomorrow's Games Preview */}
      {tomorrowsGames.length > 0 && (
        <Section title="Tomorrow's Games" count={tomorrowsGames.length}>
          <div className="space-y-2">
            {tomorrowsGames.map((g) => (
              <GameCard key={g.id} game={g} compact />
            ))}
          </div>
        </Section>
      )}

      {/* Today's Transfers */}
      <Section title="Today's Transfers" count={todaysTransfers.length}>
        {todaysTransfers.length > 0 ? (
          <div className="space-y-2">
            {todaysTransfers.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg bg-ng-card px-3 py-2">
                <span className="w-12 text-sm font-bold text-ng-green">{t.time}</span>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{t.teamName || 'Staff'}</div>
                  <div className="text-xs text-slate-400">
                    {t.fromLocation} → {t.toLocation}
                  </div>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-slate-500">No transfers today</div>
        )}
      </Section>

      {/* Today's Events */}
      {todaysEvents.length > 0 && (
        <Section title="Today's Events" count={todaysEvents.length}>
          <div className="space-y-2">
            {todaysEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg bg-ng-card px-3 py-2">
                <Clock size={14} className="text-slate-400" />
                <span className="w-12 text-sm font-bold text-ng-green">{e.time}</span>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{e.title}</div>
                  {e.location && (
                    <div className="text-xs text-slate-400">{e.location}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Pending Tasks */}
      <Section title="Pending Tasks" count={pendingTasks.length}>
        {pendingTasks.length > 0 ? (
          <div className="space-y-1">
            {pendingTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 rounded-lg bg-ng-card px-3 py-2 text-sm">
                <div
                  className={`h-2 w-2 rounded-full ${
                    t.priority === 'urgent'
                      ? 'bg-red-500'
                      : t.priority === 'high'
                        ? 'bg-amber-500'
                        : 'bg-slate-500'
                  }`}
                />
                <span className="flex-1">{t.title}</span>
                {t.dueDate && (
                  <span className="text-xs text-slate-500">{t.dueDate}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-slate-500">All caught up!</div>
        )}
      </Section>
    </div>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
        {count > 0 && (
          <span className="rounded-full bg-ng-card px-2 py-0.5 text-xs text-slate-400">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-amber-500/20 text-amber-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${colors[status] || colors.scheduled}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
