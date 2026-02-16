import { supabase } from './supabase'

// ============================================
// Snake ↔ camelCase converters
// ============================================

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

function rowToModel<T>(row: Record<string, unknown>): T {
  const obj: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    obj[snakeToCamel(key)] = value
  }
  return obj as T
}

function modelToRow(model: Record<string, unknown>): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(model)) {
    // Skip id, createdAt, updatedAt — let DB handle those
    if (key === 'createdAt' || key === 'updatedAt') continue
    obj[camelToSnake(key)] = value
  }
  return obj
}

// ============================================
// Generic CRUD operations
// ============================================

export async function fetchAll<T>(
  table: string,
  tournamentId: string
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []).map((row) => rowToModel<T>(row))
}

export async function insertRow<T extends { id: string }>(
  table: string,
  item: Omit<T, 'id'>
): Promise<T> {
  const row = modelToRow(item as Record<string, unknown>)
  // Remove id if empty string (let DB generate UUID)
  if (row.id === '') delete row.id

  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select()
    .single()

  if (error) throw error
  return rowToModel<T>(data)
}

export async function updateRow<T>(
  table: string,
  id: string,
  patch: Partial<T>
): Promise<void> {
  const row = modelToRow(patch as Record<string, unknown>)
  delete row.id // Never update the PK

  const { error } = await supabase
    .from(table)
    .update(row)
    .eq('id', id)

  if (error) throw error
}

export async function deleteRow(
  table: string,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) throw error
}
