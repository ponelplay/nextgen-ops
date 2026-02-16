import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './components/AuthProvider'
import { AuthGate } from './components/AuthGate'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Games } from './pages/Games'
import { Teams } from './pages/Teams'
import { Contacts } from './pages/Contacts'
import { Transfers } from './pages/Transfers'
import { Tasks } from './pages/Tasks'
import { People } from './pages/People'
import { Flights } from './pages/Flights'
import { TournamentContext } from './hooks/useTournament'
import { TOURNAMENTS } from './data/tournaments'

const queryClient = new QueryClient()

function App() {
  const [tournamentId, setTournamentId] = useState(TOURNAMENTS[0].id)
  const tournament = TOURNAMENTS.find((t) => t.id === tournamentId) || TOURNAMENTS[0]

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>
          <TournamentContext.Provider
            value={{ tournament, setTournamentId, tournaments: TOURNAMENTS }}
          >
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="games" element={<Games />} />
                  <Route path="people" element={<People />} />
                  <Route path="teams" element={<Teams />} />
                  <Route path="contacts" element={<Contacts />} />
                  <Route path="flights" element={<Flights />} />
                  <Route path="transfers" element={<Transfers />} />
                  <Route path="tasks" element={<Tasks />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TournamentContext.Provider>
        </AuthGate>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
