import { describe, expect, it, beforeEach } from 'vitest'
import { loginLocal, signupLocal, getSession, logoutLocal } from '../lib/localAuth'
import { USERS_KEY, SESSION_KEY } from '../localUsers'

beforeEach(() => {
  localStorage.clear()
})

describe('localAuth', () => {
  it('logs in seeded user', () => {
    const user = loginLocal('user@example.com', 'password')
    expect(user?.email).toBe('user@example.com')
    expect(getSession()?.email).toBe('user@example.com')
  })

  it('signs up new user and persists', () => {
    const created = signupLocal('new@example.com', 'pass')
    expect(created?.email).toBe('new@example.com')
    const session = getSession()
    expect(session?.email).toBe('new@example.com')
  })

  it('prevents duplicate signup', () => {
    signupLocal('dup@example.com', 'one')
    const second = signupLocal('dup@example.com', 'two')
    expect(second).toBeNull()
  })

  it('logout clears session', () => {
    loginLocal('user@example.com', 'password')
    logoutLocal()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })
})
