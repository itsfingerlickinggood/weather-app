import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useUI } from '../context/ui'
import { useAuth } from '../context/auth'
import AppIcon from './AppIcon'

const sidebarImageIcons = {
  '/': '/icons/weather/today.png',
  '/forecast': '/icons/weather/predict.png',
  '/maps': '/icons/weather/maps.png',
  '/aqi': '/icons/weather/health.png',
  '/trip': '/icons/weather/trip-planner.png',
  '/feedback': '/icons/weather/feedback.png',
  '/saved': '/icons/weather/saved-cities.png',
  '/settings': '/icons/weather/settings.png',
}

const coreItems = [
  { to: '/', label: 'Today', icon: 'today' },
  { to: '/forecast', label: 'Forecast', icon: 'forecast' },
  { to: '/maps', label: 'Maps & Radar', icon: 'maps' },
]

const insightItems = [
  { to: '/aqi', label: 'AQI & Alerts', icon: 'aqi' },
  { to: '/trip', label: 'Trip Planner', icon: 'trip' },
  { to: '/feedback', label: 'Feedback', icon: 'feedback' },
  { to: '/saved', label: 'Saved Cities', icon: 'saved' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

const adminItems = [
  { to: '/admin/usage', label: 'Admin Usage', icon: 'adminUsage', admin: true },
  { to: '/admin/cities', label: 'Admin Cities', icon: 'adminCities', admin: true },
  { to: '/admin/feedback', label: 'Admin Feedback', icon: 'adminFeedback', admin: true },
]

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { reduceMotion } = useUI()
  const { isAuthenticated, hasRole } = useAuth()

  const navClass = ({ isActive }) =>
    `group type-ui flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition ${
      isActive ? 'bg-blue-500/15 font-semibold text-white shadow-[0_10px_20px_-16px_rgba(2,6,23,0.9)]' : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
    } ${reduceMotion ? '' : 'duration-150 ease-out'}`

  const isVisible = (it) => {
    if (it.admin) return isAuthenticated && hasRole('admin')
    if (it.to === '/saved') return isAuthenticated
    return true
  }

  const sections = [
    { label: 'Weather', items: coreItems.filter(isVisible) },
    { label: 'Planning', items: insightItems.filter(isVisible) },
    { label: 'Admin', items: adminItems.filter(isVisible) },
  ].filter((section) => section.items.length > 0)

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col gap-3 px-3 py-3.5 ${
        collapsed ? 'w-16' : 'w-64'
      } ${reduceMotion ? '' : 'transition-[width] duration-200 ease-in-out'}`}
      aria-label="Primary"
    >
      <div className="surface-float mb-1 flex items-center justify-between rounded-2xl px-2 py-1.5">
        {!collapsed ? <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</p> : <span />}
        <button
          className="focus-ring rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <AppIcon name={collapsed ? 'chevronRight' : 'chevronLeft'} className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto" aria-label="Primary navigation">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed ? <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{section.label}</p> : null}
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.to === '/'}>
                {sidebarImageIcons[item.to] ? (
                  <img src={sidebarImageIcons[item.to]} alt="" className="h-7 w-7 rounded-sm object-cover" aria-hidden="true" loading="eager" decoding="async" />
                ) : (
                  <AppIcon name={item.icon} className="h-7 w-7" />
                )}
                {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {!collapsed ? <p className="type-caption px-2 text-slate-500">Focused weather signals</p> : null}
    </aside>
  )
}

export default Sidebar
