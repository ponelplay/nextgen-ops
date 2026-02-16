import { createContext, useContext } from 'react'
import type { Tournament } from '../types'
import { TOURNAMENTS } from '../data/tournaments'

interface TournamentContextValue {
  tournament: Tournament
  setTournamentId: (id: string) => void
  tournaments: Tournament[]
}

export const TournamentContext = createContext<TournamentContextValue>({
  tournament: TOURNAMENTS[0],
  setTournamentId: () => {},
  tournaments: TOURNAMENTS,
})

export function useTournament() {
  return useContext(TournamentContext)
}
