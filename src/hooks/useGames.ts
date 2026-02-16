import { useQuery } from '@tanstack/react-query'
import { fetchGames, fetchClubs } from '../api/euroleague'
import type { ApiGame, ApiClub } from '../types'

export function useGames(seasonCode: string) {
  return useQuery<ApiGame[]>({
    queryKey: ['games', seasonCode],
    queryFn: () => fetchGames(seasonCode),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useClubs(seasonCode: string) {
  return useQuery<ApiClub[]>({
    queryKey: ['clubs', seasonCode],
    queryFn: () => fetchClubs(seasonCode),
    staleTime: 30 * 60 * 1000,
  })
}
