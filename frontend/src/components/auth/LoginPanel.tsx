import { type FormEvent, useState } from 'react'
import { useAuthStore } from '../../store/authStore'

export function LoginPanel() {
  const [email, setEmail] = useState('demo@cuverie.local')
  const [password, setPassword] = useState('cuverie')
  const [error, setError] = useState<string | null>(null)
  const login = useAuthStore((state) => state.login)
  const status = useAuthStore((state) => state.status)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    const success = await login(email, password)
    if (!success) {
      setError('Identifiants incorrects. Essayez à nouveau.')
    }
  }

  const isSubmitting = status === 'loading'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
      >
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>
          <p className="text-sm text-slate-500">Accédez au pilotage de la cuverie</p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoComplete="username"
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </button>
        <p className="text-center text-xs text-slate-400">
          Démo : demo@cuverie.local · cuverie
        </p>
      </form>
    </div>
  )
}

