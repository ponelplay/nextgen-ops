import { useState, useMemo } from 'react'
import { Plus, Phone, MapPin, Users, Clock } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useSupabaseData } from '../hooks/useSupabaseData'
import { useClubs } from '../hooks/useGames'
import { Modal, FormField, inputClass, selectClass } from '../components/Modal'
import { openPhone } from '../utils/communication'
import { displayName } from '../utils/teams'
import { formatDisplayDate } from '../utils/time'
import type { Transfer } from '../types'

const STATUS_OPTIONS = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const

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

export function Transfers() {
  const { tournament } = useTournament()
  const { data: clubs } = useClubs(tournament.seasonCode)
  const { items: transfers, add, update, remove } = useSupabaseData<Transfer>('transfers', tournament.id)
  const [editing, setEditing] = useState<Transfer | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [dateFilter, setDateFilter] = useState<string | null>(null)

  const dates = useMemo(() => {
    const set = new Set(transfers.map((t) => t.date))
    return Array.from(set).sort()
  }, [transfers])

  const filtered = useMemo(() => {
    let list = transfers
    if (dateFilter) list = list.filter((t) => t.date === dateFilter)
    return list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })
  }, [transfers, dateFilter])

  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transfer[]>()
    for (const t of filtered) {
      const existing = map.get(t.date) || []
      existing.push(t)
      map.set(t.date, existing)
    }
    return map
  }, [filtered])

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Transfers</h1>
        <button
          onClick={() => {
            setEditing({ ...EMPTY_TRANSFER, id: '', tournamentId: tournament.id } as Transfer)
            setIsNew(true)
          }}
          className="flex items-center gap-1 rounded-lg bg-ng-green px-3 py-2 text-sm font-medium text-white active:bg-ng-green-dark"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Date filters */}
      {dates.length > 0 && (
        <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
          <FilterChip label="All" active={!dateFilter} onClick={() => setDateFilter(null)} />
          {dates.map((d) => (
            <FilterChip
              key={d}
              label={formatDisplayDate(d)}
              active={dateFilter === d}
              onClick={() => setDateFilter(d)}
            />
          ))}
        </div>
      )}

      {/* Transfer list */}
      {Array.from(groupedByDate.entries()).map(([date, dayTransfers]) => (
        <div key={date} className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-ng-green">
            {formatDisplayDate(date)}
          </h2>
          <div className="space-y-2">
            {dayTransfers.map((t) => (
              <TransferCard
                key={t.id}
                transfer={t}
                onEdit={() => {
                  setEditing(t)
                  setIsNew(false)
                }}
                onStatusChange={(status) => update(t.id, { status })}
              />
            ))}
          </div>
        </div>
      ))}

      {transfers.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          No transfers yet. Tap + to add one.
        </div>
      )}

      {/* Edit/Add modal */}
      {editing && (
        <TransferFormModal
          transfer={editing}
          isNew={isNew}
          clubs={clubs || []}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (isNew) {
              add(data)
            } else {
              update(editing.id, data)
            }
            setEditing(null)
          }}
          onDelete={
            isNew
              ? undefined
              : () => {
                  remove(editing.id)
                  setEditing(null)
                }
          }
        />
      )}
    </div>
  )
}

function TransferCard({
  transfer,
  onEdit,
  onStatusChange,
}: {
  transfer: Transfer
  onEdit: () => void
  onStatusChange: (status: Transfer['status']) => void
}) {
  const statusColors: Record<string, string> = {
    scheduled: 'border-l-blue-500',
    in_progress: 'border-l-amber-500',
    completed: 'border-l-green-500',
    cancelled: 'border-l-red-500 opacity-50',
  }

  return (
    <div
      className={`rounded-lg border border-ng-border border-l-4 bg-ng-card p-3 ${statusColors[transfer.status]}`}
      onClick={onEdit}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-ng-green" />
          <span className="font-bold text-ng-green">{transfer.time}</span>
          <span className="text-sm font-medium">{transfer.teamName || 'EL Staff'}</span>
        </div>
        {transfer.pax > 0 && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Users size={12} /> {transfer.pax}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <MapPin size={12} className="text-slate-500" />
        <span>{transfer.fromLocation}</span>
        <span className="text-slate-600">→</span>
        <span>{transfer.toLocation}</span>
      </div>
      {transfer.driverName && (
        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>Driver: {transfer.driverName}</span>
          {transfer.driverPhone && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                openPhone(transfer.driverPhone)
              }}
              className="flex items-center gap-1 text-green-400"
            >
              <Phone size={12} /> Call
            </button>
          )}
        </div>
      )}

      {/* Quick status toggle */}
      <div className="mt-2 flex gap-1">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(s)
            }}
            className={`rounded px-2 py-0.5 text-xs capitalize ${
              transfer.status === s
                ? 'bg-ng-green text-white'
                : 'bg-ng-card text-slate-500'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
        active ? 'bg-ng-green text-white' : 'bg-ng-card text-slate-400'
      }`}
    >
      {label}
    </button>
  )
}

function TransferFormModal({
  transfer,
  isNew,
  clubs,
  onClose,
  onSave,
  onDelete,
}: {
  transfer: Transfer
  isNew: boolean
  clubs: any[]
  onClose: () => void
  onSave: (data: Omit<Transfer, 'id'>) => void
  onDelete?: () => void
}) {
  const [form, setForm] = useState(transfer)
  const set = (field: keyof Transfer, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <Modal open title={isNew ? 'New Transfer' : 'Edit Transfer'} onClose={onClose}>
      <FormField label="Date">
        <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Time">
        <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Team">
        <select
          value={form.teamName}
          onChange={(e) => set('teamName', e.target.value)}
          className={selectClass}
        >
          <option value="">Staff / General</option>
          {clubs.map((c: any) => (
            <option key={c.code} value={displayName(c.editorialName)}>{displayName(c.editorialName)}</option>
          ))}
        </select>
      </FormField>
      <FormField label="From">
        <input value={form.fromLocation} onChange={(e) => set('fromLocation', e.target.value)} placeholder="Hotel, Airport..." className={inputClass} />
      </FormField>
      <FormField label="To">
        <input value={form.toLocation} onChange={(e) => set('toLocation', e.target.value)} placeholder="Venue, Hotel..." className={inputClass} />
      </FormField>
      <FormField label="Passengers">
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
