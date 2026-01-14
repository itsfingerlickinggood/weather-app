import { defaultUsers, USERS_KEY, SESSION_KEY } from '../localUsers'

const loadUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return [...defaultUsers]
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [...defaultUsers]
  } catch (_err) {
    return [...defaultUsers]
  }
}

const saveUsers = (users) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

const persistSession = (user) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email, roles: user.roles, name: user.name }))
}

const clearSession = () => localStorage.removeItem(SESSION_KEY)

export const getSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_err) {
    return null
  }
}

export const loginLocal = (email, password) => {
  const users = loadUsers()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
  if (!user) return null
  persistSession(user)
  return user
}

export const signupLocal = (email, password) => {
  const users = loadUsers()
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) return null
  const user = { email, password, roles: ['user'], name: email.split('@')[0] || 'New User' }
  users.push(user)
  saveUsers(users)
  persistSession(user)
  return user
}

export const logoutLocal = () => {
  clearSession()
}

export const getUsers = () => loadUsers()
