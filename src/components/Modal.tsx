import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border-t border-ng-border bg-ng-surface sm:max-w-lg sm:rounded-2xl sm:border">
        <div className="sticky top-0 flex items-center justify-between border-b border-ng-border bg-ng-surface px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

interface FormFieldProps {
  label: string
  children: ReactNode
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-sm font-medium text-slate-300">{label}</label>
      {children}
    </div>
  )
}

export const inputClass =
  'w-full rounded-lg border border-ng-border bg-ng-card px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-ng-green focus:outline-none'

export const selectClass =
  'w-full rounded-lg border border-ng-border bg-ng-card px-3 py-2 text-sm text-white focus:border-ng-green focus:outline-none'
