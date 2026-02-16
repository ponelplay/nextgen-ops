// Simple localStorage persistence until Supabase is wired up
// Each entity type gets its own key

function getKey(entity: string, tournamentId?: string): string {
  return tournamentId ? `ngops_${entity}_${tournamentId}` : `ngops_${entity}`
}

export function loadFromStorage<T>(entity: string, tournamentId?: string): T[] {
  try {
    const raw = localStorage.getItem(getKey(entity, tournamentId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveToStorage<T>(entity: string, data: T[], tournamentId?: string): void {
  localStorage.setItem(getKey(entity, tournamentId), JSON.stringify(data))
}

export function generateId(): string {
  return crypto.randomUUID()
}
