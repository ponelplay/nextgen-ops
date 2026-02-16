import { useState, useMemo } from 'react'
import {
  PlaneLanding,
  PlaneTakeoff,
  Bus,
  Phone,
  ChevronDown,
  ChevronRight,
  Clock,
  User,
  Users,
} from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useSupabaseData } from '../hooks/useSupabaseData'
import { useClubs } from '../hooks/useGames'
import { displayName } from '../utils/teams'
import { openPhone, openWhatsApp } from '../utils/communication'
import type { Person, Transfer } from '../types'

type FlightEntry = {
  person: Person
  type: 'arrival' | 'departure'
  date: string
  time: string
  flight: string
  clubName: string
  clubCrest?: string
}

type Tab = 'arrivals' | 'departures'

export function Flights() {
  const { tournament } = useTournament()
  const { items: people } = useSupabaseData<Person>('people', tournament.id)
  const { items: transfers } = useSupabaseData<Transfer>('transfers', tournament.id)
  const { data: clubs } = useClubs(tournament.seasonCode)
  const [tab, setTab] = useState<Tab>('arrivals')
  const [expandedDate, setExpandedDate] = useState<string | null>(null)

  // Build flight entries from people data
  const flights = useMemo(() => {
    const entries: FlightEntry[] = []

    for (const person of people) {
      const club = clubs?.find((c) => c.code === person.clubCode)
      const clubName =
        person.clubCode === 'STAFF'
          ? 'Staff'
          : club
            ? displayName(club.editorialName)
            : person.clubCode

      const clubCrest = club?.images.crest

      if (person.arrivalDate || person.arrivalFlight) {
        entries.push({
          person,
          type: 'arrival',
          date: person.arrivalDate,
          time: person.arrivalTime,
          flight: person.arrivalFlight,
          clubName,
          clubCrest,
        })
      }

      if (person.departureDate || person.departureFlight) {
        entries.push({
          person,
          type: 'departure',
          date: person.departureDate,
          time: person.departureTime,
          flight: person.departureFlight,
          clubName,
          clubCrest,
        })
      }
    }

    return entries
  }, [people, clubs])

  // Filter by tab
  const filtered = useMemo(
    () => flights.filter((f) => f.type === tab),
    [flights, tab]
  )

  // Group by date, sorted chronologically
  const byDate = useMemo(() => {
    const map: Record<string, FlightEntry[]> = {}
    for (const f of filtered) {
      const key = f.date || 'TBD'
      if (!map[key]) map[key] = []
      map[key].push(f)
    }
    // Sort each date's entries by time
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
    }
    // Return sorted date keys
    const sortedKeys = Object.keys(map).sort((a, b) => {
      if (a === 'TBD') return 1
      if (b === 'TBD') return -1
      return a.localeCompare(b)
    })
    return sortedKeys.map((date) => ({ date, entries: map[date] }))
  }, [filtered])

  // Count arrivals / departures for tab badges
  const arrivalCount = flights.filter((f) => f.type === 'arrival').length
  const departureCount = flights.filter((f) => f.type === 'departure').length

  // Find linked transfer for a person on a date
  const findTransfer = (personName: string, date: string) =>
    transfers.find(
      (t) =>
        t.date === date &&
        (t.notes?.toLowerCase().includes(personName.toLowerCase()) ||
          t.teamName?.toLowerCase().includes(personName.toLowerCase()))
    )

  const formatDate = (dateStr: string) => {
    if (dateStr === 'TBD') return 'Date TBD'
    try {
      const d = new Date(dateStr + 'T00:00:00')
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const toggleDate = (date: string) =>
    setExpandedDate((prev) => (prev === date ? null : date))

  return (
    <div className="p-4">
      {/* Tab switcher */}
      <div className="mb-4 flex gap-2">
        <TabButton
          active={tab === 'arrivals'}
          onClick={() => setTab('arrivals')}
          icon={<PlaneLanding size={16} />}
          label="Arrivals"
          count={arrivalCount}
        />
        <TabButton
          active={tab === 'departures'}
          onClick={() => setTab('departures')}
          icon={<PlaneTakeoff size={16} />}
          label="Departures"
          count={departureCount}
        />
      </div>

      {/* Flight board */}
      {byDate.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500">
          No {tab} registered yet.
          <br />
          Add flight info in People → edit a person's Travel tab.
        </div>
      ) : (
        <div className="space-y-3">
          {byDate.map(({ date, entries }) => (
            <div key={date}>
              {/* Date header */}
              <button
                onClick={() => toggleDate(date)}
                className="mb-1 flex w-full items-center justify-between rounded-lg bg-ng-surface px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {formatDate(date)}
                  </span>
                  <span className="rounded-full bg-ng-card px-2 py-0.5 text-xs text-slate-400">
                    {entries.length}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform ${
                    expandedDate === date ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Entries — always show, collapse is optional */}
              {(expandedDate === date || expandedDate === null) && (
                <div className="space-y-1">
                  {entries.map((entry, i) => (
                    <FlightRow
                      key={`${entry.person.id}-${i}`}
                      entry={entry}
                      transfer={findTransfer(entry.person.name, date)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary bar */}
      {people.length > 0 && (
        <div className="mt-6 rounded-xl border border-ng-border bg-ng-card p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Summary
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-ng-green">{people.length}</div>
              <div className="text-xs text-slate-400">Total People</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">{arrivalCount}</div>
              <div className="text-xs text-slate-400">Arrivals</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">{departureCount}</div>
              <div className="text-xs text-slate-400">Departures</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-ng-green text-white'
          : 'border border-ng-border bg-ng-card text-slate-400'
      }`}
    >
      {icon}
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-xs ${
          active ? 'bg-white/20 text-white' : 'bg-ng-surface text-slate-500'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function FlightRow({
  entry,
  transfer,
}: {
  entry: FlightEntry
  transfer: Transfer | undefined
}) {
  const { person, time, flight, clubName, clubCrest } = entry
  const [expanded, setExpanded] = useState(false)

  // Parse flight string to extract flight number
  const flightCode = flight?.split('·')[0]?.trim() || flight || '—'

  return (
    <div className="rounded-lg border border-ng-border bg-ng-card">
      {/* Main row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        {/* Time */}
        <div className="w-14 shrink-0">
          {time ? (
            <span className="text-sm font-bold text-el-orange">{time}</span>
          ) : (
            <span className="text-xs text-slate-500">TBD</span>
          )}
        </div>

        {/* Flight code */}
        <div className="w-16 shrink-0">
          <span className="rounded bg-ng-surface px-1.5 py-0.5 text-xs font-mono font-medium text-slate-300">
            {flightCode.length > 8 ? flightCode.substring(0, 8) : flightCode}
          </span>
        </div>

        {/* Person + club */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {clubCrest && (
            <img src={clubCrest} alt="" className="crest-img h-5 w-5 shrink-0" />
          )}
          {!clubCrest && person.clubCode === 'STAFF' && (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ng-green/20">
              <User size={10} className="text-ng-green" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{person.name}</div>
            <div className="truncate text-xs text-slate-500">{clubName}</div>
          </div>
        </div>

        {/* Transfer status indicator */}
        <div className="shrink-0">
          {transfer ? (
            <div
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                transfer.status === 'completed'
                  ? 'bg-green-500/20 text-green-400'
                  : transfer.status === 'in_progress'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              <Bus size={10} className="inline" />
            </div>
          ) : (
            <ChevronRight size={14} className="text-slate-600" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-ng-border px-3 py-2.5 text-sm">
          {/* Full flight info */}
          {flight && (
            <div className="mb-2 flex items-start gap-2">
              <Clock size={14} className="mt-0.5 shrink-0 text-slate-500" />
              <span className="text-slate-300">{flight}</span>
            </div>
          )}

          {/* Transfer info */}
          {transfer ? (
            <div className="mb-2 rounded-lg bg-ng-surface p-2">
              <div className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-400">
                <Bus size={12} />
                Transfer arranged
              </div>
              <div className="text-xs text-slate-300">
                {transfer.time} · {transfer.fromLocation} → {transfer.toLocation}
              </div>
              {transfer.driverName && (
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <span>
                    Driver: {transfer.driverName}
                  </span>
                  {transfer.driverPhone && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openPhone(transfer.driverPhone)
                      }}
                      className="text-ng-green"
                    >
                      <Phone size={10} />
                    </button>
                  )}
                </div>
              )}
              <div
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${
                  transfer.status === 'completed'
                    ? 'bg-green-500/20 text-green-400'
                    : transfer.status === 'in_progress'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {transfer.status.replace('_', ' ')}
              </div>
            </div>
          ) : (
            <div className="mb-2 rounded-lg bg-ng-surface p-2 text-xs text-slate-500">
              <Bus size={12} className="mb-0.5 mr-1 inline" />
              No transfer arranged yet
            </div>
          )}

          {/* Contact buttons */}
          <div className="flex gap-2">
            {person.phone && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openPhone(person.phone)
                }}
                className="flex items-center gap-1 rounded-lg bg-ng-surface px-3 py-1.5 text-xs text-slate-300 active:bg-slate-700"
              >
                <Phone size={12} /> Call
              </button>
            )}
            {person.whatsapp && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  openWhatsApp(person.whatsapp)
                }}
                className="flex items-center gap-1 rounded-lg bg-green-800/30 px-3 py-1.5 text-xs text-green-400 active:bg-green-800/50"
              >
                <Users size={12} /> WhatsApp
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
