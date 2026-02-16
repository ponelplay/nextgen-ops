import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAll, insertRow, updateRow, deleteRow } from '../lib/supabase-data'

/**
 * Generic hook for Supabase-backed data with optimistic UI.
 * Drop-in replacement for useLocalData — same API surface.
 */
export function useSupabaseData<T extends { id: string }>(
  table: string,
  tournamentId: string
) {
  const queryClient = useQueryClient()
  const queryKey = [table, tournamentId]

  const { data: items = [], isLoading, error } = useQuery<T[]>({
    queryKey,
    queryFn: () => fetchAll<T>(table, tournamentId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const addMutation = useMutation({
    mutationFn: (item: Omit<T, 'id'>) => insertRow<T>(table, item),
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<T> }) =>
      updateRow<T>(table, id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<T[]>(queryKey)
      queryClient.setQueryData<T[]>(queryKey, (old) =>
        (old || []).map((it) => (it.id === id ? { ...it, ...patch } : it))
      )
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev)
    },
    onSettled: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteRow(table, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<T[]>(queryKey)
      queryClient.setQueryData<T[]>(queryKey, (old) =>
        (old || []).filter((it) => it.id !== id)
      )
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev)
    },
    onSettled: invalidate,
  })

  const add = (item: Omit<T, 'id'>) => {
    addMutation.mutate(item)
  }

  const update = (id: string, patch: Partial<T>) => {
    updateMutation.mutate({ id, patch })
  }

  const remove = (id: string) => {
    removeMutation.mutate(id)
  }

  return { items, isLoading, error, add, update, remove }
}
