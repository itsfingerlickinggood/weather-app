import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/auth'
import AppIcon from './AppIcon'

const primaryItems = [
  { to: '/', label: 'Today', icon: 'today' },
  { to: '/forecast', label: 'Forecast', icon: 'forecast' },
  { to: '/maps', label: 'Maps', icon: 'maps' },
  { to: '/aqi', label: 'Health', icon: 'aqi' },
]

const secondaryItems = [
  { to: '/trip', label: 'Trip Planner', icon: 'trip' },
  { to: '/saved', label: 'Saved Cities', icon: 'saved' },
  { to: '/feedback', label: 'Feedback', icon: 'feedback' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

const adminItems = [
  { to: '/admin/usage', label: 'Admin Usage', icon: 'adminUsage' },
  { to: '/admin/cities', label: 'Admin Cities', icon: 'adminCities' },
  { to: '/admin/feedback', label: 'Admin Feedback', icon: 'adminFeedback' },
]

const linkClass = ({ isActive }) =>
  `focus-ring flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] transition ${
    isActive ? 'bg-blue-500/18 text-white' : 'text-slate-300 hover:bg-white/5'
  }`

const sheetLinkClass = ({ isActive }) =>
  `focus-ring flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
    isActive ? 'bg-blue-500/18 text-white' : 'text-slate-200 hover:bg-white/5'
  }`

const MobileNav = ({ isOpen, onClose }) => {
  const { isAuthenticated, hasRole } = useAuth()
  const showAdmin = isAuthenticated && hasRole('admin')

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  return (
    <>
      <nav className="surface-float fixed inset-x-3 bottom-2 z-40 flex items-center gap-1 rounded-2xl p-1.5 md:hidden" aria-label="Primary mobile navigation">
        {primaryItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
            <AppIcon name={item.icon} className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {isOpen ? <button className="fixed inset-0 z-40 bg-slate-950/45 md:hidden" aria-label="Close navigation drawer" onClick={onClose} /> : null}
      <aside
        id="mobile-nav-sheet"
        className={`surface-float fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-white/10 p-4 pb-8 transition-transform md:hidden ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-label="Secondary mobile navigation"
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
      >
        <div className="mb-3 h-1.5 w-12 rounded-full bg-white/20" />
        <div className="space-y-2">
          {secondaryItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={sheetLinkClass} onClick={onClose}>
              <AppIcon name={item.icon} className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        {showAdmin ? (
          <div className="mt-4 space-y-2">
            <p className="px-1 text-[11px] uppercase tracking-[0.14em] text-slate-500">Admin</p>
            {adminItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={sheetLinkClass} onClick={onClose}>
                <AppIcon name={item.icon} className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ) : null}
      </aside>
    </>
  )
}

export default MobileNav
