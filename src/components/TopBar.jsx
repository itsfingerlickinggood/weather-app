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
    const payload = weatherQuery.data?.data
    if (!payload) return null
    return `${payload.temp}° · ${payload.summary}`
  }, [weatherQuery.data])

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/5 bg-slate-900/70 px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-3">
        <div className="rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-100 shadow-sm shadow-black/30">
          {summary || 'Loading…'}
        </div>
        <div className="flex-1">
          <CitySearch compact onSelect={() => {}} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button className="focus-ring rounded-full bg-white/5 px-3 py-1 text-xs" onClick={toggleTheme}>
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
        {user ? (
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-slate-100">
            <span>{user.name || user.email}</span>
            <button className="underline" onClick={logout}>
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default TopBar
