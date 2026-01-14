import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { configureApiAuth, readStoredTokens } from '../lib/api'
import { getSession, loginLocal, logoutLocal, signupLocal } from '../lib/localAuth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const autoLoginDemo = import.meta.env.VITE_AUTO_LOGIN_DEMO === 'true'
  const [user, setUser] = useState(() => getSession())
  const [status, setStatus] = useState(() => (autoLoginDemo ? 'loading' : 'ready'))
  const [error, setError] = useState('')
  const autoFiredRef = useRef(false)

  const handleLogout = useCallback(() => {
    logoutLocal()
    localStorage.removeItem('awi_tokens')
    setUser(null)
  }, [])

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

  const login = useCallback((email, password) => {
    setStatus('loading')
    const found = loginLocal(email, password)
    if (!found) {
      setError('Account not found. Please sign up to continue.')
      setStatus('ready')
      return null
    }
    setError('')
    setUser(found)
    setStatus('ready')
    return found
  }, [])

  const signup = useCallback((email, password) => {
    setStatus('loading')
    const created = signupLocal(email, password)
    if (!created) {
      setError('User already exists. Try logging in.')
      setStatus('ready')
      return null
    }
    setError('')
    setUser(created)
    setStatus('ready')
    return created
  }, [])

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
