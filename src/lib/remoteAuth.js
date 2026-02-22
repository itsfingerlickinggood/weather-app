import api from './api'
import { SESSION_KEY } from '../localUsers'

const persistSession = (user) => {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: user.id || user._id,
      email: user.email,
      roles: user.roles || [],
      name: user.name,
    }),
  )
}

export const getRemoteSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_err) {
    return null
  }
}

export const loginRemote = async (email, password) => {
  const { data } = await api.post('/api/auth/login', { email, password })
  persistSession(data.user)
  return data.user
}

export const signupRemote = async (email, password) => {
  const { data } = await api.post('/api/auth/signup', { email, password })
  persistSession(data.user)
  return data.user
}

export const logoutRemote = () => {
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('awi_tokens')
}
