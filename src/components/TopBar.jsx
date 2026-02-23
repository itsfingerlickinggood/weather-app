import CitySearch from './CitySearch'
import { useAuth } from '../context/auth'
import { useUI } from '../context/ui'
import { useWeather, useLocations } from '../hooks/queries'
import { useMemo } from 'react'
import AppIcon from './AppIcon'

const TopBar = ({ onOpenMenu, mobileMenuOpen = false }) => {
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
    <header className="sticky top-0 z-30 flex items-center gap-2 px-4 py-2.5 md:px-5">
      <div className="surface-float flex flex-1 items-center gap-2 rounded-2xl px-3 py-2 md:px-3.5">
        <button
          className="focus-ring rounded-xl bg-white/5 p-2 text-slate-200 md:hidden"
          onClick={onOpenMenu}
          aria-label="Open navigation drawer"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-sheet"
        >
          <AppIcon name="menu" className="h-6 w-6" />
        </button>
        <div className="hidden items-center gap-1.5 rounded-xl bg-white/5 px-2.5 py-1 md:flex">
          <img src="/icons/weather/logo.png" alt="Kerala Climate Studio logo" className="h-6 w-6 rounded object-cover" loading="eager" decoding="async" />
          <span className="type-ui text-sm font-semibold tracking-tight text-slate-100">Kerala Climate Studio</span>
        </div>
        <div className="type-ui rounded-xl bg-white/5 px-3 py-1 text-sm font-medium text-slate-200">
          {summary || 'Loading weather…'}
        </div>
        <div className="min-w-0 flex-1 md:basis-[30rem] md:max-w-[38rem]">
          <CitySearch compact onSelect={() => {}} />
        </div>
        <div className="flex items-center gap-1">
        <button
          className="focus-ring theme-toggle type-ui flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 font-semibold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <>
              <AppIcon name="moon" className="h-6 w-6" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <AppIcon name="sun" className="h-6 w-6" />
              <span>Light</span>
            </>
          )}
        </button>
          {user ? (
          <div className="type-ui flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-slate-200">
            <span className="hidden lg:inline">{user.name || user.email}</span>
            <button className="inline-flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white" onClick={logout}>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                <img src="/icons/weather/logout.png" alt="" className="h-6 w-6 rounded-sm object-cover" aria-hidden="true" loading="eager" decoding="async" />
              </span>
              <span>Logout</span>
            </button>
          </div>
        ) : null}
        </div>
      </div>
    </header>
  )
}

export default TopBar
