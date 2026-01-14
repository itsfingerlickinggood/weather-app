import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

export const readStoredTokens = () => {
  try {
    const raw = localStorage.getItem('awi_tokens')
    if (!raw) return { accessToken: null, refreshToken: null, userEmail: null, roles: [] }
    const parsed = JSON.parse(raw)
    return {
      accessToken: parsed.accessToken || null,
      refreshToken: parsed.refreshToken || null,
      userEmail: parsed.userEmail || null,
      roles: parsed.roles || [],
    }
  } catch (_err) {
    return { accessToken: null, refreshToken: null, userEmail: null, roles: [] }
  }
}

let getTokens = () => readStoredTokens()
let refreshTokens = null
let logout = null
let isRefreshing = false
let refreshPromise = null

export const configureApiAuth = ({ getTokensFn, refreshFn, logoutFn }) => {
  getTokens = getTokensFn || getTokens
  refreshTokens = refreshFn || refreshTokens
  logout = logoutFn || logout
}

api.interceptors.request.use((config) => {
  const tokens = getTokens() || {}
  if (tokens.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`
  }
  if (tokens.userEmail) {
    config.headers['x-local-user'] = JSON.stringify({ email: tokens.userEmail, roles: tokens.roles || [] })
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config || {}

    if (status === 401 && !originalRequest.__isRetry && refreshTokens) {
      if (isRefreshing) {
        await refreshPromise
        originalRequest.__isRetry = true
        return api(originalRequest)
      }

      try {
        isRefreshing = true
        refreshPromise = refreshTokens()
        await refreshPromise
        originalRequest.__isRetry = true
        return api(originalRequest)
      } catch (refreshError) {
        logout?.()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export const fetchWithCache = async (cacheKey, fn) => {
  try {
    const data = await fn()
    localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }))
    return { data, offline: false }
  } catch (error) {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const parsed = JSON.parse(cached)
      return { data: parsed.data, offline: true }
    }
    throw error
  }
}

export default api
