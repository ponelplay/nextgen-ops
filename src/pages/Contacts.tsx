import { useState, useMemo } from 'react'
import { Plus, Search } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useSupabaseData } from '../hooks/useSupabaseData'
import { ContactCard } from '../components/ContactCard'
import { Modal, FormField, inputClass, selectClass } from '../components/Modal'
import type { Contact, ContactRole } from '../types'

const ROLES: ContactRole[] = ['staff', 'organization', 'hotel', 'transport', 'team', 'venue', 'catering', 'other']

const EMPTY_CONTACT: Omit<Contact, 'id'> = {
  tournamentId: null,
  name: '',
  role: 'other',
  organization: '',
  phone: '',
  email: '',
  whatsapp: '',
  telegram: '',
  notes: '',
}

export function Contacts() {
  const { tournament } = useTournament()
  const { items: contacts, add, update, remove } = useSupabaseData<Contact>('contacts', tournament.id)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<ContactRole | null>(null)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [isNew, setIsNew] = useState(false)

  const filtered = useMemo(() => {
    let list = contacts
    if (roleFilter) list = list.filter((c) => c.role === roleFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.organization.toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name))
  }, [contacts, roleFilter, search])

  const activeRoles = useMemo(() => {
    const set = new Set(contacts.map((c) => c.role))
    return ROLES.filter((r) => set.has(r))
  }, [contacts])

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Contacts</h1>
        <button
          onClick={() => {
            setEditing({ ...EMPTY_CONTACT, id: '', tournamentId: tournament.id } as Contact)
            setIsNew(true)
          }}
          className="flex items-center gap-1 rounded-lg bg-ng-green px-3 py-2 text-sm font-medium text-white active:bg-ng-green-dark"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className={`${inputClass} pl-9`}
        />
      </div>

      {/* Role filters */}
      <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
        <FilterChip label="All" active={!roleFilter} onClick={() => setRoleFilter(null)} />
        {activeRoles.map((r) => (
          <FilterChip
            key={r}
            label={r}
            active={roleFilter === r}
            onClick={() => setRoleFilter(r)}
          />
        ))}
      </div>

      {/* Contact list */}
      <div className="space-y-3">
        {filtered.map((c) => (
          <ContactCard
            key={c.id}
            contact={c}
            onEdit={(contact) => {
              setEditing(contact)
              setIsNew(false)
            }}
            onDelete={remove}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          {contacts.length === 0 ? 'No contacts yet. Tap + to add one.' : 'No contacts match your search.'}
        </div>
      )}

      {/* Edit/Add modal */}
      {editing && (
        <ContactFormModal
          contact={editing}
          isNew={isNew}
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
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium capitalize ${
        active ? 'bg-ng-green text-white' : 'bg-ng-card text-slate-400'
      }`}
    >
      {label}
    </button>
  )
}

function ContactFormModal({
  contact,
  isNew,
  onClose,
  onSave,
}: {
  contact: Contact
  isNew: boolean
  onClose: () => void
  onSave: (data: Omit<Contact, 'id'>) => void
}) {
  const [form, setForm] = useState(contact)
  const set = (field: keyof Contact, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <Modal open title={isNew ? 'New Contact' : 'Edit Contact'} onClose={onClose}>
      <FormField label="Name">
        <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" className={inputClass} />
      </FormField>
      <FormField label="Role">
        <select value={form.role} onChange={(e) => set('role', e.target.value)} className={selectClass}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Organization">
        <input value={form.organization} onChange={(e) => set('organization', e.target.value)} placeholder="Company, team, hotel..." className={inputClass} />
      </FormField>
      <FormField label="Phone">
        <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+971..." className={inputClass} />
      </FormField>
      <FormField label="WhatsApp">
        <input type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="+971... (if different from phone)" className={inputClass} />
      </FormField>
      <FormField label="Email">
        <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" className={inputClass} />
      </FormField>
      <FormField label="Telegram">
        <input value={form.telegram} onChange={(e) => set('telegram', e.target.value)} placeholder="@username" className={inputClass} />
      </FormField>
      <FormField label="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          placeholder="Any notes..."
          className={inputClass}
        />
      </FormField>
      <button
        onClick={() => {
          const { id, ...data } = form
          onSave(data)
        }}
        className="mt-2 w-full rounded-lg bg-ng-green py-2.5 text-sm font-semibold text-white active:bg-ng-green-dark"
      >
        {isNew ? 'Add Contact' : 'Save Changes'}
      </button>
    </Modal>
  )
}
