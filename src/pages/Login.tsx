import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setLoading(false)
  }

  return (
    <div className="flex h-full items-center justify-center bg-ng-bg p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-1">
            <span className="text-3xl font-black tracking-tight text-ng-green">NEXTGEN</span>
            <span className="text-3xl font-light text-ng-text">ops</span>
          </div>
          <p className="text-sm text-ng-text-dim">Tournament Logistics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-ng-border bg-ng-card px-4 py-3 text-white placeholder:text-ng-text-dim focus:border-ng-green focus:outline-none"
              placeholder="andrea@euroleague.net"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-ng-border bg-ng-card px-4 py-3 text-white placeholder:text-ng-text-dim focus:border-ng-green focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-ng-green py-3 text-sm font-semibold text-white transition-colors active:bg-ng-green-dark disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
