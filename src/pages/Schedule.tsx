import { useState, useMemo } from 'react'
import {
  Plus,
  Bus,
  Coffee,
  Users,
  Dumbbell,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  Wand2,
  Loader2,
  Utensils,
  Landmark,
  Check,
} from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useSupabaseData } from '../hooks/useSupabaseData'
import { useClubs, useGames } from '../hooks/useGames'
import { Modal, FormField, inputClass, selectClass } from '../components/Modal'
import { openPhone } from '../utils/communication'
import { displayName } from '../utils/teams'
import { formatDisplayDate, formatLocalDate } from '../utils/time'
import { getLocationNames, PLACES } from '../data/tournaments'
import type { Transfer, DailyEvent, ApiGame } from '../types'

const STATUS_OPTIONS = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const

type EventFilter = 'all' | 'transfer' | 'practice' | 'meal' | 'meeting' | 'other'

const FILTER_CHIPS: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'transfer', label: 'Transfers' },
  { value: 'practice', label: 'Practices' },
  { value: 'meal', label: 'Meals' },
  { value: 'meeting', label: 'Meetings' },
  { value: 'other', label: 'Other' },
]

// Unified timeline entry — either a Transfer or a DailyEvent
type TimelineEntry = {
  id: string
  date: string
  time: string
  kind: 'transfer' | 'event'
  type: string // transfer status / event type
  title: string
  subtitle: string
  passengers: string[] // for transfers: team names; for events: [teamName]
  raw: Transfer | DailyEvent
}

const EMPTY_TRANSFER: Omit<Transfer, 'id'> = {
  tournamentId: '',
  date: '',
  time: '',
  fromLocation: '',
  toLocation: '',
  teamId: null,
  teamName: '',
  driverName: '',
  driverPhone: '',
  vehicleInfo: '',
  pax: 0,
  status: 'scheduled',
  notes: '',
}

const EMPTY_EVENT: Omit<DailyEvent, 'id'> = {
  tournamentId: '',
  date: '',
  time: '',
  endTime: '',
  type: 'practice',
  title: '',
  description: '',
  teamId: null,
  teamName: '',
  location: '',
  notes: '',
}

export function Schedule() {
  const { tournament } = useTournament()
  const { data: clubs } = useClubs(tournament.seasonCode)
  const { data: games } = useGames(tournament.seasonCode)
  const { items: transfers, add: addTransfer, update: updateTransfer, remove: removeTransfer } =
    useSupabaseData<Transfer>('transfers', tournament.id)
  const { items: events, add: addEvent, update: updateEvent, remove: removeEvent } =
    useSupabaseData<DailyEvent>('daily_events', tournament.id)

  const [filter, setFilter] = useState<EventFilter>('all')
  const [dateFilter, setDateFilter] = useState<string | null>(null)
  const [editingTransfer, setEditingTransfer] = useState<Transfer | null>(null)
  const [editingEvent, setEditingEvent] = useState<DailyEvent | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [showGenerate, setShowGenerate] = useState(false)
  const [addType, setAddType] = useState<'transfer' | 'event' | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null)

  // Build club name list for passenger picker
  const teamNames = useMemo(() => {
    if (!clubs) return ['EL Staff']
    return [...clubs.map((c) => displayName(c.editorialName)), 'EL Staff']
  }, [clubs])

  // Build unified timeline
  const timeline = useMemo(() => {
    const entries: TimelineEntry[] = []

    for (const t of transfers) {
      const passengers = t.teamName
        ? t.teamName.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      entries.push({
        id: t.id,
        date: t.date,
        time: t.time,
        kind: 'transfer',
        type: t.status,
        title: `${t.fromLocation} → ${t.toLocation}`,
        subtitle: passengers.join(', ') || 'Staff',
        passengers,
        raw: t,
      })
    }

    for (const e of events) {
      entries.push({
        id: e.id,
        date: e.date,
        time: e.time,
        kind: 'event',
        type: e.type,
        title: e.title,
        subtitle: [e.teamName, e.location].filter(Boolean).join(' · '),
        passengers: e.teamName ? [e.teamName] : [],
        raw: e,
      })
    }

    return entries
  }, [transfers, events])

  // Filter
  const filtered = useMemo(() => {
    let list = timeline
    if (filter === 'transfer') list = list.filter((e) => e.kind === 'transfer')
    else if (filter !== 'all') list = list.filter((e) => e.kind === 'event' && e.type === filter)
    if (dateFilter) list = list.filter((e) => e.date === dateFilter)
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.time || '99:99').localeCompare(b.time || '99:99')
    })
  }, [timeline, filter, dateFilter])

  // Group by date
  const groupedByDate = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>()
    for (const e of filtered) {
      const key = e.date || 'TBD'
      const existing = map.get(key) || []
      existing.push(e)
      map.set(key, existing)
    }
    return map
  }, [filtered])

  // All dates in timeline for chips
  const allDates = useMemo(() => {
    const set = new Set(timeline.map((e) => e.date).filter(Boolean))
    return Array.from(set).sort()
  }, [timeline])

  function handleAddTransfer() {
    setEditingTransfer({ ...EMPTY_TRANSFER, id: '', tournamentId: tournament.id } as Transfer)
    setIsNew(true)
    setAddType(null)
  }

  function handleAddEvent() {
    setEditingEvent({ ...EMPTY_EVENT, id: '', tournamentId: tournament.id } as DailyEvent)
    setIsNew(true)
    setAddType(null)
  }

  function handleTapEntry(entry: TimelineEntry) {
    if (entry.kind === 'transfer') {
      setEditingTransfer(entry.raw as Transfer)
      setIsNew(false)
    } else {
      setEditingEvent(entry.raw as DailyEvent)
      setIsNew(false)
    }
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Schedule</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1 rounded-lg bg-amber-600/20 px-3 py-2 text-sm font-medium text-amber-400 active:bg-amber-600/40"
          >
            <Wand2 size={16} />
            Generate
          </button>
          <button
            onClick={() => setAddType('transfer')}
            className="flex items-center gap-1 rounded-lg bg-ng-green px-3 py-2 text-sm font-medium text-white active:bg-ng-green-dark"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFilter(chip.value)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
              filter === chip.value ? 'bg-ng-green text-white' : 'bg-ng-card text-slate-400'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Date filter chips */}
      {allDates.length > 0 && (
        <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setDateFilter(null)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
              !dateFilter ? 'bg-ng-green text-white' : 'bg-ng-card text-slate-400'
            }`}
          >
            All Days
          </button>
          {allDates.map((d) => (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                dateFilter === d ? 'bg-ng-green text-white' : 'bg-ng-card text-slate-400'
              }`}
            >
              {formatDisplayDate(d)}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      {Array.from(groupedByDate.entries()).map(([date, entries]) => (
        <div key={date} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-ng-green">
            {date === 'TBD' ? 'Date TBD' : formatDisplayDate(date)}
          </h2>
          <div className="space-y-2">
            {entries.map((entry) => (
              <TimelineCard key={entry.id} entry={entry} onTap={() => handleTapEntry(entry)} />
            ))}
          </div>
        </div>
      ))}

      {timeline.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          No schedule yet. Tap <span className="text-amber-400">Generate</span> to auto-create transfers for a team, or <span className="text-ng-green">+ Add</span> manually.
        </div>
      )}

      {filtered.length === 0 && timeline.length > 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          No entries match the current filter.
        </div>
      )}

      {/* Summary bar */}
      {timeline.length > 0 && (
        <div className="mt-4 rounded-xl border border-ng-border bg-ng-card p-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-blue-400">
                {transfers.length}
              </div>
              <div className="text-xs text-slate-400">Transfers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-400">
                {events.filter((e) => e.type === 'practice').length}
              </div>
              <div className="text-xs text-slate-400">Practices</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">
                {events.filter((e) => e.type !== 'practice').length}
              </div>
              <div className="text-xs text-slate-400">Events</div>
            </div>
          </div>
        </div>
      )}

      {/* Add type picker */}
      {addType && (
        <Modal open title="Add to Schedule" onClose={() => setAddType(null)}>
          <div className="space-y-3">
            <button
              onClick={handleAddTransfer}
              className="flex w-full items-center gap-3 rounded-lg border border-ng-border bg-ng-card p-4 text-left active:bg-slate-700"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Bus size={20} className="text-blue-400" />
              </div>
              <div>
                <div className="font-medium">Transfer</div>
                <div className="text-xs text-slate-400">Transport from A to B (airport, hotel, venue...)</div>
              </div>
            </button>
            <button
              onClick={handleAddEvent}
              className="flex w-full items-center gap-3 rounded-lg border border-ng-border bg-ng-card p-4 text-left active:bg-slate-700"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Clock size={20} className="text-amber-400" />
              </div>
              <div>
                <div className="font-medium">Event</div>
                <div className="text-xs text-slate-400">Practice, meal, meeting, or other event</div>
              </div>
            </button>
          </div>
        </Modal>
      )}

      {/* Transfer form modal */}
      {editingTransfer && (
        <TransferFormModal
          transfer={editingTransfer}
          isNew={isNew}
          teamNames={teamNames}
          onClose={() => setEditingTransfer(null)}
          onSave={(data) => {
            if (isNew) addTransfer(data)
            else updateTransfer(editingTransfer.id, data)
            setEditingTransfer(null)
          }}
          onDelete={
            isNew
              ? undefined
              : () => {
                  removeTransfer(editingTransfer.id)
                  setEditingTransfer(null)
                }
          }
        />
      )}

      {/* Event form modal */}
      {editingEvent && (
        <EventFormModal
          event={editingEvent}
          isNew={isNew}
          teamNames={teamNames}
          onClose={() => setEditingEvent(null)}
          onSave={(data) => {
            if (isNew) addEvent(data)
            else updateEvent(editingEvent.id, data)
            setEditingEvent(null)
          }}
          onDelete={
            isNew
              ? undefined
              : () => {
                  removeEvent(editingEvent.id)
                  setEditingEvent(null)
                }
          }
        />
      )}

      {/* Generate modal */}
      {showGenerate && (
        <GenerateModal
          tournament={tournament}
          teamNames={teamNames}
          games={games || []}
          existingTransfers={transfers}
          onGenerate={(newTransfers) => {
            for (const t of newTransfers) addTransfer(t)
            setShowGenerate(false)
          }}
          onClose={() => setShowGenerate(false)}
        />
      )}
    </div>
  )
}

// === Timeline Card ===

function TimelineCard({ entry, onTap }: { entry: TimelineEntry; onTap: () => void }) {
  const iconMap: Record<string, React.ReactNode> = {
    transfer: <Bus size={14} className="text-blue-400" />,
    practice: <Dumbbell size={14} className="text-amber-400" />,
    meal: <Utensils size={14} className="text-orange-400" />,
    meeting: <Users size={14} className="text-purple-400" />,
    game: <Landmark size={14} className="text-ng-green" />,
    other: <Clock size={14} className="text-slate-400" />,
    arrival: <MapPin size={14} className="text-green-400" />,
    departure: <MapPin size={14} className="text-red-400" />,
  }

  const isTransfer = entry.kind === 'transfer'
  const transfer = isTransfer ? (entry.raw as Transfer) : null
  const statusColor = isTransfer
    ? {
        scheduled: 'border-l-blue-500',
        in_progress: 'border-l-amber-500',
        completed: 'border-l-green-500',
        cancelled: 'border-l-red-500 opacity-50',
      }[transfer!.status] || 'border-l-blue-500'
    : 'border-l-amber-500'

  return (
    <button
      onClick={onTap}
      className={`flex w-full items-center gap-3 rounded-lg border border-ng-border border-l-4 bg-ng-card px-3 py-2.5 text-left active:bg-slate-700 ${statusColor}`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ng-surface">
        {iconMap[isTransfer ? 'transfer' : entry.type] || iconMap.other}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-el-orange">{entry.time || 'TBD'}</span>
          {isTransfer && transfer?.status === 'completed' && (
            <Check size={12} className="text-green-400" />
          )}
        </div>
        <div className="truncate text-sm font-medium">{entry.title}</div>
        {entry.subtitle && (
          <div className="truncate text-xs text-slate-400">{entry.subtitle}</div>
        )}
      </div>
      {isTransfer && transfer?.pax ? (
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Users size={12} /> {transfer.pax}
        </span>
      ) : null}
      <ChevronRight size={14} className="shrink-0 text-slate-600" />
    </button>
  )
}

// === Transfer Form Modal ===

function TransferFormModal({
  transfer,
  isNew,
  teamNames,
  onClose,
  onSave,
  onDelete,
}: {
  transfer: Transfer
  isNew: boolean
  teamNames: string[]
  onClose: () => void
  onSave: (data: Omit<Transfer, 'id'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState(transfer)
  const [selectedPassengers, setSelectedPassengers] = useState<string[]>(
    transfer.teamName ? transfer.teamName.split(',').map((s) => s.trim()).filter(Boolean) : []
  )

  const set = (field: keyof Transfer, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const togglePassenger = (name: string) => {
    setSelectedPassengers((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    )
  }

  const handleSave = () => {
    const { id, ...data } = form
    data.teamName = selectedPassengers.join(', ')
    onSave(data)
  }

  return (
    <Modal open title={isNew ? 'New Transfer' : 'Edit Transfer'} onClose={onClose}>
      <FormField label="Date">
        <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Time">
        <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Passengers">
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-ng-border bg-ng-card p-2">
          {teamNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => togglePassenger(name)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                selectedPassengers.includes(name)
                  ? 'bg-ng-green text-white'
                  : 'bg-ng-surface text-slate-400'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </FormField>
      <FormField label="From">
        <input value={form.fromLocation} onChange={(e) => set('fromLocation', e.target.value)} placeholder="Hotel, Airport..." className={inputClass} />
      </FormField>
      <FormField label="To">
        <input value={form.toLocation} onChange={(e) => set('toLocation', e.target.value)} placeholder="Venue, Hotel..." className={inputClass} />
      </FormField>
      <FormField label="Passengers count">
        <input type="number" value={form.pax || ''} onChange={(e) => set('pax', parseInt(e.target.value) || 0)} className={inputClass} />
      </FormField>
      <FormField label="Driver Name">
        <input value={form.driverName} onChange={(e) => set('driverName', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Driver Phone">
        <input type="tel" value={form.driverPhone} onChange={(e) => set('driverPhone', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Vehicle">
        <input value={form.vehicleInfo} onChange={(e) => set('vehicleInfo', e.target.value)} placeholder="Bus #1, Van, etc." className={inputClass} />
      </FormField>
      <FormField label="Status">
        <select value={form.status} onChange={(e) => set('status', e.target.value)} className={selectClass}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Notes">
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={inputClass} />
      </FormField>
      <button
        onClick={handleSave}
        className="mt-2 w-full rounded-lg bg-ng-green py-2.5 text-sm font-semibold text-white active:bg-ng-green-dark"
      >
        {isNew ? 'Add Transfer' : 'Save Changes'}
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="mt-2 w-full rounded-lg border border-red-800 py-2.5 text-sm font-medium text-red-400 active:bg-red-900/30"
        >
          Delete Transfer
        </button>
      )}
    </Modal>
  )
}

// === Event Form Modal ===

function EventFormModal({
  event,
  isNew,
  teamNames,
  onClose,
  onSave,
  onDelete,
}: {
  event: DailyEvent
  isNew: boolean
  teamNames: string[]
  onClose: () => void
  onSave: (data: Omit<DailyEvent, 'id'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState(event)
  const set = (field: keyof DailyEvent, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const EVENT_TYPES = ['practice', 'meal', 'meeting', 'transfer', 'arrival', 'departure', 'other'] as const

  return (
    <Modal open title={isNew ? 'New Event' : 'Edit Event'} onClose={onClose}>
      <FormField label="Type">
        <select value={form.type} onChange={(e) => set('type', e.target.value)} className={selectClass}>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Title">
        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Team dinner, Coach meeting..." className={inputClass} />
      </FormField>
      <FormField label="Date">
        <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Start Time">
        <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="End Time">
        <input type="time" value={form.endTime} onChange={(e) => set('endTime', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Team">
        <select value={form.teamName} onChange={(e) => set('teamName', e.target.value)} className={selectClass}>
          <option value="">All / General</option>
          {teamNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Location">
        <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Venue, hotel, etc." className={inputClass} />
      </FormField>
      <FormField label="Notes">
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className={inputClass} />
      </FormField>
      <button
        onClick={() => {
          const { id, ...data } = form
          onSave(data)
        }}
        className="mt-2 w-full rounded-lg bg-ng-green py-2.5 text-sm font-semibold text-white active:bg-ng-green-dark"
      >
        {isNew ? 'Add Event' : 'Save Changes'}
      </button>
      {onDelete && (
        <button
          onClick={onDelete}
          className="mt-2 w-full rounded-lg border border-red-800 py-2.5 text-sm font-medium text-red-400 active:bg-red-900/30"
        >
          Delete Event
        </button>
      )}
    </Modal>
  )
}

// === Generate Transfers Modal ===

function GenerateModal({
  tournament,
  teamNames,
  games,
  existingTransfers,
  onGenerate,
  onClose,
}: {
  tournament: { id: string; startDate: string; endDate: string; timezone: number }
  teamNames: string[]
  games: ApiGame[]
  existingTransfers: Transfer[]
  onGenerate: (transfers: Omit<Transfer, 'id'>[]) => void
  onClose: () => void
}) {
  const [selectedTeam, setSelectedTeam] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<Omit<Transfer, 'id'>[]>([])

  const locations = getLocationNames(tournament.id)

  function generateForTeam(teamName: string) {
    const isStaff = teamName === 'EL Staff'
    const hotel = isStaff ? locations.staffHotel : locations.teamHotel
    const result: Omit<Transfer, 'id'>[] = []

    const makeTransfer = (
      date: string,
      from: string,
      to: string,
      notes: string
    ): Omit<Transfer, 'id'> => ({
      tournamentId: tournament.id,
      date,
      time: '',
      fromLocation: from,
      toLocation: to,
      teamId: null,
      teamName: teamName,
      driverName: '',
      driverPhone: '',
      vehicleInfo: '',
      pax: 0,
      status: 'scheduled',
      notes,
    })

    // Figure out the dates
    const startDate = new Date(tournament.startDate + 'T00:00:00')
    const practiceDate = new Date(startDate)
    practiceDate.setDate(practiceDate.getDate() - 1) // day before tournament
    const practiceDateStr = practiceDate.toISOString().split('T')[0]

    // Get team's game dates from API
    const teamGameDates = new Set<string>()
    if (!isStaff) {
      for (const g of games) {
        const homeTeam = displayName(g.local.club.editorialName)
        const awayTeam = displayName(g.road.club.editorialName)
        if (homeTeam === teamName || awayTeam === teamName) {
          const dateStr = formatLocalDate(g.utcDate, tournament.timezone)
          teamGameDates.add(dateStr)
        }
      }
    }

    // For staff, add game dates = all tournament dates
    if (isStaff) {
      const start = new Date(tournament.startDate + 'T00:00:00')
      const end = new Date(tournament.endDate + 'T00:00:00')
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        teamGameDates.add(d.toISOString().split('T')[0])
      }
    }

    // Arrival: day before practice or practice day
    const arrivalDateStr = practiceDateStr
    result.push(makeTransfer(arrivalDateStr, locations.airport, hotel, 'Arrival'))

    // Practice day: Hotel ↔ Venue
    if (!isStaff) {
      result.push(makeTransfer(practiceDateStr, hotel, locations.venue, 'Practice'))
      result.push(makeTransfer(practiceDateStr, locations.venue, hotel, 'Return from practice'))
    }

    // Game days: Hotel ↔ Venue
    const sortedGameDates = Array.from(teamGameDates).sort()
    for (const gDate of sortedGameDates) {
      result.push(makeTransfer(gDate, hotel, locations.venue, isStaff ? 'To venue' : 'Game day'))
      result.push(makeTransfer(gDate, locations.venue, hotel, isStaff ? 'Return from venue' : 'Return from game'))
    }

    // Departure: last game day or day after
    const lastDate = sortedGameDates[sortedGameDates.length - 1] || tournament.endDate
    result.push(makeTransfer(lastDate, hotel, locations.airport, 'Departure'))

    return result
  }

  function handlePreview() {
    if (!selectedTeam) return
    const transfers = generateForTeam(selectedTeam)
    setPreview(transfers)
  }

  function handleGenerate() {
    setGenerating(true)
    onGenerate(preview)
  }

  return (
    <Modal open title="Generate Transfers" onClose={onClose}>
      <FormField label="Generate standard transfers for">
        <select
          value={selectedTeam}
          onChange={(e) => {
            setSelectedTeam(e.target.value)
            setPreview([])
          }}
          className={selectClass}
        >
          <option value="">Select team...</option>
          {teamNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </FormField>

      {selectedTeam && preview.length === 0 && (
        <button
          onClick={handlePreview}
          className="mb-4 w-full rounded-lg bg-amber-600/20 py-2.5 text-sm font-medium text-amber-400 active:bg-amber-600/40"
        >
          Preview transfers
        </button>
      )}

      {preview.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 text-sm font-medium text-slate-300">
            Will create {preview.length} transfers for {selectedTeam}:
          </div>
          <div className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-ng-border bg-ng-card p-2">
            {preview.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-20 shrink-0 text-slate-400">{formatDisplayDate(t.date)}</span>
                <span className="flex-1 text-slate-300">
                  {t.fromLocation} → {t.toLocation}
                </span>
                <span className="text-slate-500">{t.notes}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {preview.length > 0 && (
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full rounded-lg bg-ng-green py-2.5 text-sm font-semibold text-white active:bg-ng-green-dark disabled:opacity-50"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Creating...
            </span>
          ) : (
            `Create ${preview.length} transfers`
          )}
        </button>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Times will be left empty for you to fill in. All transfers are editable and deletable after creation.
        Round trips are included (there and back).
      </p>
    </Modal>
  )
}
