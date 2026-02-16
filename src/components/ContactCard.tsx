import { Phone, Mail, MessageCircle, Send, Trash2, Edit } from 'lucide-react'
import type { Contact, ContactRole } from '../types'
import { openWhatsApp, openTelegram, openPhone, openEmail } from '../utils/communication'

const ROLE_COLORS: Record<ContactRole, string> = {
  staff: 'bg-blue-500/20 text-blue-400',
  organization: 'bg-purple-500/20 text-purple-400',
  hotel: 'bg-amber-500/20 text-amber-400',
  transport: 'bg-green-500/20 text-green-400',
  team: 'bg-ng-green/20 text-ng-green',
  venue: 'bg-cyan-500/20 text-cyan-400',
  catering: 'bg-rose-500/20 text-rose-400',
  other: 'bg-slate-500/20 text-slate-400',
}

interface ContactCardProps {
  contact: Contact
  onEdit: (contact: Contact) => void
  onDelete: (id: string) => void
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  return (
    <div className="rounded-xl border border-ng-border bg-ng-card p-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white">{contact.name}</h3>
          <p className="text-sm text-slate-400">{contact.organization}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[contact.role]}`}>
          {contact.role}
        </span>
      </div>

      {contact.notes && (
        <p className="mb-3 text-xs text-slate-500">{contact.notes}</p>
      )}

      {/* Quick actions */}
      <div className="flex gap-2">
        {contact.whatsapp && (
          <button
            onClick={() => openWhatsApp(contact.whatsapp)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600/20 text-green-400 active:bg-green-600/40"
          >
            <MessageCircle size={18} />
          </button>
        )}
        {contact.phone && (
          <button
            onClick={() => openPhone(contact.phone)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 active:bg-blue-600/40"
          >
            <Phone size={18} />
          </button>
        )}
        {contact.email && (
          <button
            onClick={() => openEmail(contact.email)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400 active:bg-purple-600/40"
          >
            <Mail size={18} />
          </button>
        )}
        {contact.telegram && (
          <button
            onClick={() => openTelegram(contact.telegram)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600/20 text-sky-400 active:bg-sky-600/40"
          >
            <Send size={18} />
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => onEdit(contact)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-slate-300 active:bg-slate-600"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete(contact.id)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-900/30 text-red-400 active:bg-red-900/50"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}
