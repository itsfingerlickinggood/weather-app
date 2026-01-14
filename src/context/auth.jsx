import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { configureApiAuth } from '../lib/api'
import { getSession, loginLocal, logoutLocal, signupLocal } from '../lib/localAuth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getSession())
  const [status, setStatus] = useState('ready')
  const [error, setError] = useState('')

  const handleLogout = useCallback(() => {
    logoutLocal()
    setUser(null)
  }, [])

  useEffect(() => {
    configureApiAuth({
      getTokensFn: () => ({ userEmail: user?.email, roles: user?.roles }),
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
    const auto = import.meta.env.VITE_AUTO_LOGIN_DEMO === 'true'
    if (auto && !user && status === 'ready') {
      login('user@example.com', 'password')
    }
  }, [login, status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
