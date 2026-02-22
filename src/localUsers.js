// Local demo users seed. Passwords are plain for demo only.
export const defaultUsers = [
  { email: 'admin@example.com', password: import.meta.env?.VITE_DEMO_ADMIN_PASSWORD || 'changeme', roles: ['admin', 'user'], name: 'Ava Admin' },
  { email: 'user@example.com', password: import.meta.env?.VITE_DEMO_USER_PASSWORD || 'changeme', roles: ['user'], name: 'Uma User' },
]

export const USERS_KEY = 'awi_local_users'
export const SESSION_KEY = 'awi_local_session'
