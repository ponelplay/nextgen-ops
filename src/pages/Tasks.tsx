import { useState, useMemo } from 'react'
import { Plus, Check, Circle, Trash2 } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { useSupabaseData } from '../hooks/useSupabaseData'
import { Modal, FormField, inputClass, selectClass } from '../components/Modal'
import type { Task } from '../types'

type Category = Task['category']
type Priority = Task['priority']

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'pre_tournament', label: 'Pre-Tournament' },
  { value: 'daily', label: 'Daily' },
  { value: 'game_day', label: 'Game Day' },
  { value: 'post_tournament', label: 'Post-Tournament' },
]

const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low']

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-500',
}

const EMPTY_TASK: Omit<Task, 'id'> = {
  tournamentId: '',
  category: 'daily',
  title: '',
  description: '',
  dueDate: '',
  dueTime: '',
  completed: false,
  priority: 'medium',
  notes: '',
}

export function Tasks() {
  const { tournament } = useTournament()
  const { items: tasks, add, update, remove } = useSupabaseData<Task>('tasks', tournament.id)
  const [catFilter, setCatFilter] = useState<Category | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [isNew, setIsNew] = useState(false)

  const filtered = useMemo(() => {
    let list = tasks
    if (catFilter) list = list.filter((t) => t.category === catFilter)
    if (!showCompleted) list = list.filter((t) => !t.completed)
    return list.sort((a, b) => {
      // Sort by: completed last, then priority (urgent first), then due date
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      const pi = PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority)
      if (pi !== 0) return pi
      return (a.dueDate || 'z').localeCompare(b.dueDate || 'z')
    })
  }, [tasks, catFilter, showCompleted])

  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Tasks</h1>
        <button
          onClick={() => {
            setEditing({ ...EMPTY_TASK, id: '', tournamentId: tournament.id } as Task)
            setIsNew(true)
          }}
          className="flex items-center gap-1 rounded-lg bg-ng-green px-3 py-2 text-sm font-medium text-white active:bg-ng-green-dark"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Category filters */}
      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        <FilterChip label="All" active={!catFilter} onClick={() => setCatFilter(null)} />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.value}
            label={c.label}
            active={catFilter === c.value}
            onClick={() => setCatFilter(c.value)}
          />
        ))}
      </div>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>{completedCount} of {tasks.length} completed</span>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-ng-green"
            >
              {showCompleted ? 'Hide completed' : 'Show completed'}
            </button>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ng-card">
            <div
              className="h-full rounded-full bg-ng-green transition-all"
              style={{ width: `${(completedCount / tasks.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {filtered.map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 rounded-lg border border-ng-border bg-ng-card p-3 ${
              task.completed ? 'opacity-50' : ''
            }`}
          >
            <button
              onClick={() => update(task.id, { completed: !task.completed })}
              className="mt-0.5 flex-shrink-0"
            >
              {task.completed ? (
                <Check size={20} className="text-green-500" />
              ) : (
                <Circle size={20} className="text-slate-500" />
              )}
            </button>
            <div
              className="flex-1"
              onClick={() => {
                setEditing(task)
                setIsNew(false)
              }}
            >
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
                <span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : ''}`}>
                  {task.title}
                </span>
              </div>
              {task.description && (
                <p className="mt-0.5 text-xs text-slate-500">{task.description}</p>
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span className="capitalize">{task.category.replace('_', ' ')}</span>
                {task.dueDate && <span>· Due {task.dueDate}</span>}
              </div>
            </div>
            <button
              onClick={() => remove(task.id)}
              className="flex-shrink-0 p-1 text-slate-600 active:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">
          {tasks.length === 0 ? 'No tasks yet. Tap + to add one.' : 'All tasks completed!'}
        </div>
      )}

      {/* Edit/Add modal */}
      {editing && (
        <TaskFormModal
          task={editing}
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
      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
        active ? 'bg-ng-green text-white' : 'bg-ng-card text-slate-400'
      }`}
    >
      {label}
    </button>
  )
}

function TaskFormModal({
  task,
  isNew,
  onClose,
  onSave,
}: {
  task: Task
  isNew: boolean
  onClose: () => void
  onSave: (data: Omit<Task, 'id'>) => void
}) {
  const [form, setForm] = useState(task)
  const set = (field: keyof Task, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <Modal open title={isNew ? 'New Task' : 'Edit Task'} onClose={onClose}>
      <FormField label="Title">
        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Task title..." className={inputClass} />
      </FormField>
      <FormField label="Description">
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className={inputClass} />
      </FormField>
      <FormField label="Category">
        <select value={form.category} onChange={(e) => set('category', e.target.value)} className={selectClass}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Priority">
        <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={selectClass}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Due Date">
        <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={inputClass} />
      </FormField>
      <FormField label="Due Time">
        <input type="time" value={form.dueTime} onChange={(e) => set('dueTime', e.target.value)} className={inputClass} />
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
        {isNew ? 'Add Task' : 'Save Changes'}
      </button>
    </Modal>
  )
}
