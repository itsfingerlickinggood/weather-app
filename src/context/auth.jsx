import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { configureApiAuth, readStoredTokens } from '../lib/api'
import { getSession, loginLocal, logoutLocal, signupLocal } from '../lib/localAuth'
import { getRemoteSession, loginRemote, logoutRemote, signupRemote } from '../lib/remoteAuth'

const AuthContext = createContext(null)

const isBackendUnavailable = (err) => {
  const code = err?.code || err?.response?.code
  const message = (err?.message || '').toLowerCase()
  return (
    code === 'ERR_NETWORK' ||
    message.includes('network error') ||
    message.includes('failed to fetch') ||
    message.includes('connection refused')
  )
}

export const AuthProvider = ({ children }) => {
  const useRemoteAuth = import.meta.env.VITE_USE_REMOTE_AUTH === 'true' && !!import.meta.env.VITE_API_URL
  const autoLoginDemo = !useRemoteAuth && import.meta.env.VITE_AUTO_LOGIN_DEMO === 'true'
  const [user, setUser] = useState(() => useRemoteAuth ? getRemoteSession() : getSession())
  const [status, setStatus] = useState(() => (autoLoginDemo ? 'loading' : 'ready'))
  const [error, setError] = useState('')
  const autoFiredRef = useRef(false)

  const handleLogout = useCallback(() => {
    if (useRemoteAuth) {
      logoutRemote()
    } else {
      logoutLocal()
      localStorage.removeItem('awi_tokens')
    }
    setUser(null)
  }, [useRemoteAuth])

  useEffect(() => {
    configureApiAuth({
      getTokensFn: () => {
        const stored = readStoredTokens()
        return {
          ...stored,
          userEmail: user?.email || stored.userEmail,
          roles: user?.roles || stored.roles,
        }
      },
      refreshFn: null,
      logoutFn: () => handleLogout(),
    })
  }, [handleLogout, user])

  const login = useCallback(
    async (email, password) => {
      setStatus('loading')
      try {
        const found = useRemoteAuth ? await loginRemote(email, password) : loginLocal(email, password)
        if (!found) {
          setError('Account not found. Please sign up to continue.')
          setStatus('ready')
          return null
        }
        setError('')
        setUser(found)
        setStatus('ready')
        return found
      } catch (err) {
        if (useRemoteAuth && isBackendUnavailable(err)) {
          try {
            const fallbackUser = loginLocal(email, password)
            if (!fallbackUser) {
              setError('Backend unavailable. Account not found locally. Please sign up to continue.')
              setStatus('ready')
              return null
            }
            setError('Backend unavailable. Signed in using local mode.')
            setUser(fallbackUser)
            setStatus('ready')
            return fallbackUser
          } catch (fallbackErr) {
            const fallbackMessage = fallbackErr?.message || 'Login failed'
            setError(fallbackMessage)
            setStatus('ready')
            return null
          }
        }
        const message = err?.response?.data?.error || err?.message || 'Login failed'
        setError(message)
        setStatus('ready')
        return null
      }
    },
    [useRemoteAuth],
  )

  const signup = useCallback(
    async (email, password) => {
      setStatus('loading')
      try {
        const created = useRemoteAuth ? await signupRemote(email, password) : signupLocal(email, password)
        if (!created) {
          setError('User already exists. Try logging in.')
          setStatus('ready')
          return null
        }
        setError('')
        setUser(created)
        setStatus('ready')
        return created
      } catch (err) {
        if (useRemoteAuth && isBackendUnavailable(err)) {
          try {
            const fallbackCreated = signupLocal(email, password)
            if (!fallbackCreated) {
              setError('Backend unavailable. User already exists locally. Try logging in.')
              setStatus('ready')
              return null
            }
            setError('Backend unavailable. Signed up using local mode.')
            setUser(fallbackCreated)
            setStatus('ready')
            return fallbackCreated
          } catch (fallbackErr) {
            const fallbackMessage = fallbackErr?.message || 'Signup failed'
            setError(fallbackMessage)
            setStatus('ready')
            return null
          }
        }
        const message = err?.response?.data?.error || err?.message || 'Signup failed'
        setError(message)
        setStatus('ready')
        return null
      }
    },
    [useRemoteAuth],
  )

  const value = useMemo(
    () => ({
      user,
      loading: status === 'loading',
      status,
      error,
      login,
      signup,
      logout: handleLogout,
      hasRole: (role) => !!user?.roles?.includes(role),
      isAuthenticated: !!user,
    }),
    [error, handleLogout, login, signup, status, user],
  )

  useEffect(() => {
    if (!autoLoginDemo) return
    if (!user && !autoFiredRef.current) {
      autoFiredRef.current = true
      login('user@example.com', 'password')
    } else if (user && status === 'loading') {
      setStatus('ready')
    }
  }, [autoLoginDemo, login, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
