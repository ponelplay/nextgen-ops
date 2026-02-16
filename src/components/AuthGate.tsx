import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Login } from '../pages/Login'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-ng-bg">
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-1">
            <span className="text-2xl font-black tracking-tight text-ng-green">NEXTGEN</span>
            <span className="text-2xl font-light text-ng-text">ops</span>
          </div>
          <div className="text-sm text-ng-text-dim">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <>{children}</>
}
