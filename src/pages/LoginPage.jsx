import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import Card from '../components/Card'

const DEMO_USERS = [
  { label: 'Login as User', email: 'user@example.com', password: 'password' },
  { label: 'Login as Admin', email: 'admin@example.com', password: 'password' },
]

const LoginPage = () => {
  const { login, signup, loading, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('user@example.com')
  const [password, setPassword] = useState('password')
  const [localError, setLocalError] = useState('')

  const redirect = () => {
    const redirectTo = location.state?.from?.pathname || '/'
    navigate(redirectTo, { replace: true })
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (!email || !password) {
      setLocalError('Enter email and password')
      return
    }
    const run = mode === 'login' ? login : signup
    const result = await run(email, password)
    if (result) redirect()
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Card title="Sign in to your weather" description="Local-only auth. No external services.">
        <div className="flex gap-2 text-sm">
          <button
            type="button"
            className={`focus-ring rounded-full px-4 py-2 ${mode === 'login' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-200'}`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`focus-ring rounded-full px-4 py-2 ${mode === 'signup' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-200'}`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO_USERS.map((demo) => (
            <button
              key={demo.label}
              type="button"
              className="focus-ring rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={() => {
                setEmail(demo.email)
                setPassword(demo.password)
                setMode('login')
              }}
              disabled={loading}
            >
              {demo.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">All stored locally; no network calls.</p>

        <form className="space-y-4" onSubmit={handleAuth}>
          <label className="block text-sm">
            <span className="text-slate-300">Email</span>
            <input
              className="focus-ring mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-300">Password</span>
            <input
              className="focus-ring mt-1 w-full rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-slate-100"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {localError ? <p className="text-sm text-red-300">{localError}</p> : null}
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            type="submit"
            className="focus-ring w-full rounded-xl bg-blue-500 px-4 py-2 font-semibold text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Working…' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
          <p className="text-xs text-slate-400">Demo: user@example.com / password</p>
        </form>
      </Card>
      <div className="text-center text-xs text-slate-500">
        Local-only auth for demo; delete data in Settings to reset.
      </div>
      <div className="text-center text-xs text-slate-500">
        <Link className="text-blue-200 underline" to="/">
          Return to app
        </Link>
      </div>
    </div>
  )
}

export default LoginPage
