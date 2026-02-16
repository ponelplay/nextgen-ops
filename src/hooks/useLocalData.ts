import { useState, useCallback } from 'react'
import { loadFromStorage, saveToStorage, generateId } from '../utils/storage'

export function useLocalData<T extends { id: string }>(entity: string, tournamentId?: string) {
  const [items, setItems] = useState<T[]>(() => loadFromStorage<T>(entity, tournamentId))

  const save = useCallback(
    (next: T[]) => {
      setItems(next)
      saveToStorage(entity, next, tournamentId)
    },
    [entity, tournamentId]
  )

  const add = useCallback(
    (item: Omit<T, 'id'>) => {
      const newItem = { ...item, id: generateId() } as T
      save([...items, newItem])
      return newItem
    },
    [items, save]
  )

  const update = useCallback(
    (id: string, patch: Partial<T>) => {
      save(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
    },
    [items, save]
  )

  const remove = useCallback(
    (id: string) => {
      save(items.filter((it) => it.id !== id))
    },
    [items, save]
  )

  return { items, add, update, remove, setItems: save }
}
