import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  Plane,
  Shield,
  AlertTriangle,
  Users,
  Copy,
  Check,
  Loader2,
} from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useClubs } from '../hooks/useGames'
import { useSupabaseData } from '../hooks/useSupabaseData'
import { Modal, FormField, inputClass, selectClass } from '../components/Modal'
import { openWhatsApp, openPhone, openEmail } from '../utils/communication'
import { displayName } from '../utils/teams'
import { fetchAll, insertRow } from '../lib/supabase-data'
import { TOURNAMENTS } from '../data/tournaments'
import type { Person, PersonRole } from '../types'
import { isKeyContact } from '../types'

const TEAM_ROLES: { value: PersonRole; label: string }[] = [
  { value: 'team_manager', label: 'Team Manager' },
  { value: 'delegate', label: 'Delegate' },
  { value: 'head_coach', label: 'Head Coach' },
  { value: 'assistant_coach', label: 'Assistant Coach' },
  { value: 'player', label: 'Player' },
  { value: 'physio', label: 'Physio' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'other', label: 'Other' },
]

const STAFF_ROLES: { value: PersonRole; label: string }[] = [
  { value: 'staff_director', label: 'Director' },
  { value: 'staff_logistics', label: 'Logistics' },
  { value: 'staff_operations', label: 'Operations' },
  { value: 'staff_competition', label: 'Competition' },
  { value: 'staff_officiating', label: 'Officiating' },
  { value: 'staff_referee', label: 'Referee Dept' },
  { value: 'staff_media', label: 'Media' },
  { value: 'staff_commercial', label: 'Commercial' },
  { value: 'staff_it', label: 'IT' },
  { value: 'staff_other', label: 'Other' },
]

const EMPTY_PERSON: Omit<Person, 'id'> = {
  tournamentId: '',
  teamId: '',
  clubCode: '',
  name: '',
  role: 'player',
  nationality: '',
  passportNumber: '',
  passportExpiry: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  whatsapp: '',
  arrivalDate: '',
  arrivalTime: '',
  arrivalFlight: '',
  departureDate: '',
  departureTime: '',
  departureFlight: '',
  hotel: '',
  roomNumber: '',
  roomType: '',
  allergies: '',
  dietaryNeeds: '',
  medicalNotes: '',
  shirtSize: '',
  notes: '',
}

export function People() {
  const { tournament } = useTournament()
  const [searchParams] = useSearchParams()
  const initialClub = searchParams.get('club')
  const { data: clubs } = useClubs(tournament.seasonCode)
  const { items: people, add, update, remove } = useSupabaseData<Person>('people', tournament.id)
  const [search, setSearch] = useState('')
  const [clubFilter, setClubFilter] = useState<string | null>(initialClub)
  const [editing, setEditing] = useState<Person | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)
  const [showCopy, setShowCopy] = useState(false)

  // Group options: Staff + each club
  const groupOptions = useMemo(() => {
    const options: { code: string; name: string; crest?: string }[] = [
      { code: 'STAFF', name: 'EuroLeague Staff' },
    ]
    if (clubs) {
      for (const c of clubs) {
        options.push({ code: c.code, name: displayName(c.editorialName), crest: c.images.crest })
      }
    }
    return options
  }, [clubs])

  const filtered = useMemo(() => {
    let list = people
    if (clubFilter) list = list.filter((p) => p.clubCode === clubFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.nationality.toLowerCase().includes(q) ||
          p.notes.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => {
      // Key contacts first, then by role priority, then name
      const aKey = isKeyContact(a.role) ? 0 : 1
      const bKey = isKeyContact(b.role) ? 0 : 1
      if (aKey !== bKey) return aKey - bKey
      return a.name.localeCompare(b.name)
    })
  }, [people, clubFilter, search])

  // Group people by club for display
  const groupedByClub = useMemo(() => {
    const map = new Map<string, Person[]>()
    for (const p of filtered) {
      const existing = map.get(p.clubCode) || []
      existing.push(p)
      map.set(p.clubCode, existing)
    }
    return map
  }, [filtered])

  const getClubName = (code: string) =>
    code === 'STAFF'
      ? 'EuroLeague Staff'
      : displayName(clubs?.find((c) => c.code === code)?.editorialName || code)

  const getClubCrest = (code: string) =>
    clubs?.find((c) => c.code === code)?.images.crest

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">People</h1>
        <div className="flex gap-2">
          {filtered.length > 0 && (
            <button
              onClick={() => setShowCopy(true)}
              className="flex items-center gap-1 rounded-lg border border-ng-border bg-ng-card px-3 py-2 text-sm font-medium text-slate-300 active:bg-slate-700"
            >
              <Copy size={14} />
              Copy to…
            </button>
          )}
          <button
            onClick={() => {
              setEditing({
                ...EMPTY_PERSON,
                id: '',
                tournamentId: tournament.id,
                clubCode: clubFilter || 'STAFF',
              } as Person)
              setIsNew(true)
            }}
            className="flex items-center gap-1 rounded-lg bg-ng-green px-3 py-2 text-sm font-medium text-white active:bg-ng-green-dark"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, role, nationality..."
          className={`${inputClass} pl-9`}
        />
      </div>

      {/* Club filter */}
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        <FilterChip label="All" active={!clubFilter} onClick={() => setClubFilter(null)} />
        <FilterChip
          label="Staff"
          active={clubFilter === 'STAFF'}
          onClick={() => setClubFilter('STAFF')}
        />
        {clubs?.map((c) => (
          <FilterChip
            key={c.code}
            label={displayName(c.editorialName)}
            active={clubFilter === c.code}
            onClick={() => setClubFilter(c.code)}
          />
        ))}
      </div>

      {/* Stats bar */}
      <div className="mb-4 flex gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Users size={12} /> {people.length} total
        </span>
        <span className="flex items-center gap-1">
          <Plane size={12} /> {people.filter((p) => p.arrivalDate).length} arrivals set
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle size={12} /> {people.filter((p) => p.allergies).length} w/ allergies
        </span>
      </div>

      {/* People list grouped by club */}
      {clubFilter ? (
        // Flat list when filtering
        <div className="space-y-2">
          {filtered.map((person) => (
            <PersonRow
              key={person.id}
              person={person}
              onTap={() => setSelectedPerson(person)}
            />
          ))}
        </div>
      ) : (
        // Grouped when showing all
        Array.from(groupedByClub.entries()).map(([code, members]) => (
          <div key={code} className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              {getClubCrest(code) ? (
                <img src={getClubCrest(code)} alt="" className="crest-img h-5 w-5" />
              ) : (
                <Shield size={16} className="text-ng-green" />
              )}
              <h2 className="text-sm font-semibold text-ng-green">{getClubName(code)}</h2>
              <span className="text-xs text-slate-500">({members.length})</span>
            </div>
            <div className="space-y-1">
              {members.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  onTap={() => setSelectedPerson(person)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {people.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          No people added yet. Tap + to start building delegations.
        </div>
      )}

      {/* Person detail modal */}
      {selectedPerson && (
        <PersonDetail
          person={selectedPerson}
          clubName={getClubName(selectedPerson.clubCode)}
          onClose={() => setSelectedPerson(null)}
          onEdit={() => {
            setEditing(selectedPerson)
            setIsNew(false)
            setSelectedPerson(null)
          }}
          onDelete={() => {
            remove(selectedPerson.id)
            setSelectedPerson(null)
          }}
        />
      )}

      {/* Edit/Add modal */}
      {editing && (
        <PersonFormModal
          person={editing}
          isNew={isNew}
          groupOptions={groupOptions}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (isNew) {
              add(data)
            } else {
              update(editing.id, data)
            }
            setEditing(null)
          }}
        />
      )}

      {/* Copy to tournament modal */}
      {showCopy && (
        <CopyModal
          people={filtered}
          currentTournamentId={tournament.id}
          onClose={() => setShowCopy(false)}
        />
      )}
    </div>
  )
}

function PersonRow({ person, onTap }: { person: Person; onTap: () => void }) {
  const hasAlert = person.allergies || person.medicalNotes || person.dietaryNeeds
  return (
    <button
      onClick={onTap}
      className="flex w-full items-center gap-3 rounded-lg border border-ng-border bg-ng-card px-3 py-2.5 text-left active:bg-slate-700"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
        {person.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{person.name}</span>
          {isKeyContact(person.role) && (
            <span className="rounded bg-ng-green/20 px-1.5 py-0.5 text-[10px] font-medium text-ng-green">
              KEY
            </span>
          )}
          {hasAlert && <AlertTriangle size={12} className="text-amber-400" />}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="capitalize">{person.role.replace(/_/g, ' ')}</span>
          {person.roomNumber && <span>· Room {person.roomNumber}</span>}
        </div>
      </div>
      {/* Quick contact icons */}
      <div className="flex gap-1">
        {person.whatsapp && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              openWhatsApp(person.whatsapp)
            }}
            className="flex h-7 w-7 items-center justify-center rounded bg-green-600/20 text-green-400"
          >
            <MessageCircle size={14} />
          </button>
        )}
        {person.phone && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              openPhone(person.phone)
            }}
            className="flex h-7 w-7 items-center justify-center rounded bg-blue-600/20 text-blue-400"
          >
            <Phone size={14} />
          </button>
        )}
      </div>
      <ChevronRight size={14} className="text-slate-600" />
    </button>
  )
}

function PersonDetail({
  person,
  clubName,
  onClose,
  onEdit,
  onDelete,
}: {
  person: Person
  clubName: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Modal open title={person.name} onClose={onClose}>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <p className="text-sm text-slate-400">{clubName}</p>
          <p className="capitalize text-ng-green">{person.role.replace(/_/g, ' ')}</p>
          {person.nationality && (
            <p className="text-xs text-slate-500">{person.nationality}</p>
          )}
        </div>

        {/* Contact actions */}
        {(person.phone || person.whatsapp || person.email) && (
          <div className="flex gap-2">
            {person.whatsapp && (
              <button
                onClick={() => openWhatsApp(person.whatsapp)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600/20 py-2.5 text-sm font-medium text-green-400 active:bg-green-600/40"
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
            )}
            {person.phone && (
              <button
                onClick={() => openPhone(person.phone)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600/20 py-2.5 text-sm font-medium text-blue-400 active:bg-blue-600/40"
              >
                <Phone size={16} /> Call
              </button>
            )}
            {person.email && (
              <button
                onClick={() => openEmail(person.email)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600/20 py-2.5 text-sm font-medium text-purple-400 active:bg-purple-600/40"
              >
                <Mail size={16} /> Email
              </button>
            )}
          </div>
        )}

        {/* Alerts */}
        {(person.allergies || person.medicalNotes || person.dietaryNeeds) && (
          <div className="rounded-lg border border-amber-800 bg-amber-900/20 p-3">
            <div className="mb-1 flex items-center gap-1 text-sm font-medium text-amber-400">
              <AlertTriangle size={14} /> Health Info
            </div>
            {person.allergies && (
              <p className="text-sm text-amber-200">Allergies: {person.allergies}</p>
            )}
            {person.medicalNotes && (
              <p className="text-sm text-amber-200">Medical: {person.medicalNotes}</p>
            )}
            {person.dietaryNeeds && (
              <p className="text-sm text-amber-200">Dietary: {person.dietaryNeeds}</p>
            )}
          </div>
        )}

        {/* Travel info */}
        {(person.arrivalFlight || person.departureFlight) && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300">Travel</h4>
            {person.arrivalFlight && (
              <InfoRow label="Arrival" value={`${person.arrivalFlight} · ${person.arrivalDate} ${person.arrivalTime}`} />
            )}
            {person.departureFlight && (
              <InfoRow label="Departure" value={`${person.departureFlight} · ${person.departureDate} ${person.departureTime}`} />
            )}
          </div>
        )}

        {/* Accommodation */}
        {(person.hotel || person.roomNumber) && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300">Accommodation</h4>
            {person.hotel && <InfoRow label="Hotel" value={person.hotel} />}
            {person.roomNumber && <InfoRow label="Room" value={`${person.roomNumber} ${person.roomType ? `(${person.roomType})` : ''}`} />}
          </div>
        )}

        {/* ID info */}
        {person.passportNumber && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300">ID / Passport</h4>
            <InfoRow label="Passport" value={person.passportNumber} />
            {person.passportExpiry && <InfoRow label="Expiry" value={person.passportExpiry} />}
            {person.dateOfBirth && <InfoRow label="DOB" value={person.dateOfBirth} />}
          </div>
        )}

        {person.notes && (
          <div className="rounded-lg bg-ng-card p-3 text-sm text-slate-300">
            <span className="text-xs font-medium text-slate-500">Notes</span>
            <div className="mt-1">{person.notes}</div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg bg-ng-green py-2.5 text-sm font-semibold text-white active:bg-ng-green-dark"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-800 px-4 py-2.5 text-sm font-medium text-red-400 active:bg-red-900/30"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded bg-ng-card px-3 py-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

function PersonFormModal({
  person,
  isNew,
  groupOptions,
  onClose,
  onSave,
}: {
  person: Person
  isNew: boolean
  groupOptions: { code: string; name: string }[]
  onClose: () => void
  onSave: (data: Omit<Person, 'id'>) => void
}) {
  const [form, setForm] = useState(person)
  const [section, setSection] = useState<'basic' | 'travel' | 'accommodation' | 'health' | 'id'>('basic')
  const set = (field: keyof Person, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const isStaff = form.clubCode === 'STAFF'
  const roles = isStaff ? STAFF_ROLES : TEAM_ROLES

  const SECTIONS = [
    { key: 'basic' as const, label: 'Basic' },
    { key: 'travel' as const, label: 'Travel' },
    { key: 'accommodation' as const, label: 'Room' },
    { key: 'health' as const, label: 'Health' },
    { key: 'id' as const, label: 'ID' },
  ]

  return (
    <Modal open title={isNew ? 'Add Person' : 'Edit Person'} onClose={onClose}>
      {/* Section tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              section === s.key ? 'bg-ng-green text-white' : 'bg-ng-card text-slate-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'basic' && (
        <>
          <FormField label="Team / Group">
            <select
              value={form.clubCode}
              onChange={(e) => set('clubCode', e.target.value)}
              className={selectClass}
            >
              {groupOptions.map((g) => (
                <option key={g.code} value={g.code}>{g.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Name">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className={inputClass} />
          </FormField>
          <FormField label="Role">
            <select value={form.role} onChange={(e) => set('role', e.target.value as PersonRole)} className={selectClass}>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Nationality">
            <input value={form.nationality} onChange={(e) => set('nationality', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Phone">
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+..." className={inputClass} />
          </FormField>
          <FormField label="WhatsApp">
            <input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="If different from phone" className={inputClass} />
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
          </FormField>
        </>
      )}

      {section === 'travel' && (
        <>
          <h3 className="mb-2 text-sm font-semibold text-slate-300">Arrival</h3>
          <FormField label="Date">
            <input type="date" value={form.arrivalDate} onChange={(e) => set('arrivalDate', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Time">
            <input type="time" value={form.arrivalTime} onChange={(e) => set('arrivalTime', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Flight">
            <input value={form.arrivalFlight} onChange={(e) => set('arrivalFlight', e.target.value)} placeholder="EK101" className={inputClass} />
          </FormField>
          <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-300">Departure</h3>
          <FormField label="Date">
            <input type="date" value={form.departureDate} onChange={(e) => set('departureDate', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Time">
            <input type="time" value={form.departureTime} onChange={(e) => set('departureTime', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Flight">
            <input value={form.departureFlight} onChange={(e) => set('departureFlight', e.target.value)} placeholder="EK102" className={inputClass} />
          </FormField>
        </>
      )}

      {section === 'accommodation' && (
        <>
          <FormField label="Hotel">
            <input value={form.hotel} onChange={(e) => set('hotel', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Room Number">
            <input value={form.roomNumber} onChange={(e) => set('roomNumber', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Room Type">
            <select value={form.roomType} onChange={(e) => set('roomType', e.target.value)} className={selectClass}>
              <option value="">—</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="twin">Twin</option>
              <option value="suite">Suite</option>
            </select>
          </FormField>
          <FormField label="Shirt Size">
            <select value={form.shirtSize} onChange={(e) => set('shirtSize', e.target.value)} className={selectClass}>
              <option value="">—</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </FormField>
        </>
      )}

      {section === 'health' && (
        <>
          <FormField label="Allergies">
            <textarea value={form.allergies} onChange={(e) => set('allergies', e.target.value)} rows={2} placeholder="Nuts, shellfish, medications..." className={inputClass} />
          </FormField>
          <FormField label="Dietary Needs">
            <input value={form.dietaryNeeds} onChange={(e) => set('dietaryNeeds', e.target.value)} placeholder="Halal, vegetarian, vegan..." className={inputClass} />
          </FormField>
          <FormField label="Medical Notes">
            <textarea value={form.medicalNotes} onChange={(e) => set('medicalNotes', e.target.value)} rows={2} placeholder="Any medical conditions, medications..." className={inputClass} />
          </FormField>
        </>
      )}

      {section === 'id' && (
        <>
          <FormField label="Date of Birth">
            <input type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Passport Number">
            <input value={form.passportNumber} onChange={(e) => set('passportNumber', e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Passport Expiry">
            <input type="date" value={form.passportExpiry} onChange={(e) => set('passportExpiry', e.target.value)} className={inputClass} />
          </FormField>
        </>
      )}

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
        {isNew ? 'Add Person' : 'Save Changes'}
      </button>
    </Modal>
  )
}

function CopyModal({
  people,
  currentTournamentId,
  onClose,
}: {
  people: Person[]
  currentTournamentId: string
  onClose: () => void
}) {
  const otherTournaments = TOURNAMENTS.filter((t) => t.id !== currentTournamentId)
  const [targetId, setTargetId] = useState<string | null>(null)
  const [status, setStatus] = useState<'pick' | 'loading' | 'done'>('pick')
  const [result, setResult] = useState({ copied: 0, skipped: 0 })

  const handleCopy = async () => {
    if (!targetId) return
    setStatus('loading')

    // Fetch existing people in target tournament to avoid duplicates
    const existing = await fetchAll<Person>('people', targetId)
    const existingKeys = new Set(existing.map((p) => `${p.name}::${p.clubCode}`))

    let copied = 0
    let skipped = 0

    for (const person of people) {
      const key = `${person.name}::${person.clubCode}`
      if (existingKeys.has(key)) {
        skipped++
        continue
      }

      const payload: Omit<Person, 'id'> = {
        tournamentId: targetId,
        teamId: person.teamId,
        clubCode: person.clubCode,
        name: person.name,
        role: person.role,
        nationality: person.nationality,
        passportNumber: person.passportNumber,
        passportExpiry: person.passportExpiry,
        dateOfBirth: person.dateOfBirth,
        phone: person.phone,
        email: person.email,
        whatsapp: person.whatsapp,
        allergies: person.allergies,
        dietaryNeeds: person.dietaryNeeds,
        medicalNotes: person.medicalNotes,
        shirtSize: person.shirtSize,
        notes: person.notes,
        // Clear tournament-specific fields
        arrivalDate: '',
        arrivalTime: '',
        arrivalFlight: '',
        departureDate: '',
        departureTime: '',
        departureFlight: '',
        hotel: '',
        roomNumber: '',
        roomType: '',
      }

      try {
        await insertRow<Person>('people', payload)
        copied++
      } catch {
        // Skip on error (e.g. constraint violation)
        skipped++
      }
    }

    setResult({ copied, skipped })
    setStatus('done')
  }

  const target = otherTournaments.find((t) => t.id === targetId)

  return (
    <Modal open title="Copy People" onClose={onClose}>
      {status === 'pick' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Copy <span className="font-semibold text-white">{people.length} people</span> to another tournament.
            Personal info will be kept, travel & hotel details will be cleared.
          </p>

          <div className="space-y-2">
            {otherTournaments.map((t) => (
              <button
                key={t.id}
                onClick={() => setTargetId(t.id)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${
                  targetId === t.id
                    ? 'border-ng-green bg-ng-green/10'
                    : 'border-ng-border bg-ng-card'
                }`}
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-slate-400">{t.city} · {t.startDate}</div>
                </div>
                {targetId === t.id && <Check size={16} className="text-ng-green" />}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            disabled={!targetId}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold ${
              targetId
                ? 'bg-ng-green text-white active:bg-ng-green-dark'
                : 'bg-ng-card text-slate-500 cursor-not-allowed'
            }`}
          >
            Copy {people.length} people to {target?.city || '…'}
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 size={24} className="animate-spin text-ng-green" />
          <p className="text-sm text-slate-400">Copying people to {target?.name}…</p>
        </div>
      )}

      {status === 'done' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ng-green/20">
              <Check size={24} className="text-ng-green" />
            </div>
            <p className="text-lg font-bold text-white">{result.copied} copied</p>
            {result.skipped > 0 && (
              <p className="text-sm text-slate-400">{result.skipped} skipped (already exist)</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-ng-green py-2.5 text-sm font-semibold text-white active:bg-ng-green-dark"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
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
