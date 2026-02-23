import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth'
import AppIcon from '../components/AppIcon'

const DEMO_USERS = [
  { label: 'Demo user', email: 'user@example.com', password: import.meta.env.VITE_DEMO_USER_PASSWORD || 'changeme' },
  { label: 'Demo admin', email: 'admin@example.com', password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'changeme' },
]

const LoginPage = () => {
  const { login, signup, loading, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('user@example.com')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [errorKey, setErrorKey] = useState(0)

  const redirect = () => {
    const to = location.state?.from?.pathname || '/'
    navigate(to, { replace: true })
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (!email || !password) {
      setLocalError('Enter email and password')
      setErrorKey((k) => k + 1)
      return
    }
    const result = await (mode === 'login' ? login : signup)(email, password)
    if (result) redirect()
    else setErrorKey((k) => k + 1)
  }

  return (
    <div className="login-page">
      {/* Ambient orbs */}
      <div className="login-orbs" aria-hidden="true">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      {/* Centred column */}
      <div className="login-center">

        {/* Brand mark */}
        <div className="login-brand">
          <div className="login-logo-ring">
            <AppIcon name="brand" className="h-6 w-6 text-blue-300" />
          </div>
          <h1 className="login-title">Kerala Climate Studio</h1>
          <p className="login-subtitle">Real-time weather for Kerala</p>
        </div>

        {/* Card */}
        <div className="login-card">

          {/* Mode toggle */}
          <div className="login-toggle-wrap">
            <div className="login-toggle-inner">
              <div
                className="login-tab-pill"
                style={{ transform: mode === 'signup' ? 'translateX(100%)' : 'translateX(0)' }}
                aria-hidden="true"
              />
              {[
                { id: 'login', label: 'Sign in' },
                { id: 'signup', label: 'Sign up' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`focus-ring login-tab-btn ${mode === id ? 'login-tab-active' : 'login-tab-idle'}`}
                  onClick={() => setMode(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Demo quick-fill */}
          <div className="login-demo-row">
            {DEMO_USERS.map((d) => (
              <button
                key={d.label}
                type="button"
                className="focus-ring login-demo-btn"
                onClick={() => { setEmail(d.email); setPassword(d.password); setMode('login') }}
                disabled={loading}
              >
                <span className="login-demo-icon">
                  <AppIcon name="users" className="h-2.5 w-2.5 text-blue-300" />
                </span>
                <span>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="login-form" noValidate>
            <div className="login-field">
              <label className="login-label" htmlFor="lp-email">Email</label>
              <input
                id="lp-email"
                className="focus-ring login-input"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="lp-password">Password</label>
              <input
                id="lp-password"
                className="focus-ring login-input"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {(localError || error) ? (
              <p key={errorKey} className="login-error">
                <AppIcon name="alert" className="h-3.5 w-3.5 flex-shrink-0" />
                {localError || error}
              </p>
            ) : null}

            <button
              type="submit"
              className="focus-ring login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-loading">
                  <span className="login-spinner" />
                  Working…
                </span>
              ) : (
                mode === 'login' ? 'Sign in' : 'Create account'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="login-footer">
          <Link className="login-back-link" to="/">← Back to app</Link>
        </p>

      </div>
    </div>
  )
}

export default LoginPage

