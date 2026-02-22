import CitySearch from './CitySearch'
import { useAuth } from '../context/auth'
import { useUI } from '../context/ui'
import { useWeather, useLocations } from '../hooks/queries'
import { useMemo } from 'react'

const TopBar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useUI()
  const { data: locations = [] } = useLocations()
  const defaultLoc = isAuthenticated ? locations[0]?.id : null
  const weatherQuery = useWeather(defaultLoc)

  const summary = useMemo(() => {
    const payload = weatherQuery.data
    if (!payload) return null
    return `${payload.temp}°C · ${payload.summary}`
  }, [weatherQuery.data])

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 bg-slate-900/30 px-5 py-3 backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-3">
        <div className="rounded-2xl bg-white/10 px-3.5 py-2 text-sm font-medium text-slate-100 shadow-lg shadow-black/20">
          {summary || 'Loading…'}
        </div>
        <div className="flex-1">
          <CitySearch compact onSelect={() => {}} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button 
          className="focus-ring theme-toggle flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition-all hover:bg-white/20" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <span className="text-sm">🌙</span>
              <span>Dark</span>
            </>
          ) : (
            <>
              <span className="text-sm">☀️</span>
              <span>Light</span>
            </>
          )}
        </button>
        {user ? (
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100">
            <span>{user.name || user.email}</span>
            <button className="font-semibold text-slate-200 hover:text-white" onClick={logout}>
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default TopBar
