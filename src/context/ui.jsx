import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const storageKey = 'awi_ui'
const defaultState = { theme: 'dark', reduceMotion: false, highContrast: false, largeFont: false }

const UIContext = createContext(null)

export const UIProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState
    } catch (error) {
      console.error('Unable to read UI prefs', error)
      return defaultState
    }
  })

  const [toasts, setToasts] = useState([])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
    document.documentElement.dataset.theme = state.theme
    document.body.classList.toggle('contrast-boost', state.highContrast)
    document.body.classList.toggle('text-lg', state.largeFont)
  }, [state])

  const value = useMemo(
    () => ({
      ...state,
      toasts,
      pushToast: (msg, tone = 'info') => {
        const id = crypto.randomUUID()
        setToasts((prev) => [...prev, { id, msg, tone }])
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500)
      },
      dismissToast: (id) => setToasts((prev) => prev.filter((t) => t.id !== id)),
      toggleTheme: () => setState((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' })),
      toggleMotion: () => setState((prev) => ({ ...prev, reduceMotion: !prev.reduceMotion })),
      toggleContrast: () => setState((prev) => ({ ...prev, highContrast: !prev.highContrast })),
      toggleFont: () => setState((prev) => ({ ...prev, largeFont: !prev.largeFont })),
    }),
    [state, toasts],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export const useUI = () => {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
