import type { ApiGame, ApiClub } from '../types'

const BASE_URL = 'https://api-live.euroleague.net/v2'

interface ApiResponse<T> {
  data: T[]
  total: number
}

export async function fetchGames(seasonCode: string): Promise<ApiGame[]> {
  const res = await fetch(
    `${BASE_URL}/competitions/J/seasons/${seasonCode}/games`
  )
  if (!res.ok) throw new Error(`Failed to fetch games: ${res.status}`)
  const json: ApiResponse<ApiGame> = await res.json()
  return json.data
}

export async function fetchClubs(seasonCode: string): Promise<ApiClub[]> {
  const res = await fetch(
    `${BASE_URL}/competitions/J/seasons/${seasonCode}/clubs`
  )
  if (!res.ok) throw new Error(`Failed to fetch clubs: ${res.status}`)
  const json: ApiResponse<ApiClub> = await res.json()
  return json.data
}
