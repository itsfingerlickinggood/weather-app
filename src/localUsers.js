// Local demo users seed. Passwords are plain for demo only.
export const defaultUsers = [
  { email: 'admin@example.com', password: 'password', roles: ['admin', 'user'], name: 'Ava Admin' },
  { email: 'user@example.com', password: 'password', roles: ['user'], name: 'Uma User' },
]

export const USERS_KEY = 'awi_local_users'
export const SESSION_KEY = 'awi_local_session'
