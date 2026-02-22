import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useUI } from '../context/ui'
import { useAuth } from '../context/auth'

const coreItems = [
  { to: '/', label: 'Today', icon: '🌤️' },
  { to: '/forecast', label: 'Forecast', icon: '🗓️' },
  { to: '/maps', label: 'Maps & Radar', icon: '🗺️' },
]

const insightItems = [
  { to: '/aqi', label: 'AQI & Alerts', icon: '💨' },
  { to: '/trip', label: 'Trip Planner', icon: '🧳' },
  { to: '/feedback', label: 'Feedback', icon: '💬' },
  { to: '/saved', label: 'Saved Cities', icon: '📌' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

const adminItems = [
  { to: '/admin/usage', label: 'Admin Usage', icon: '🛡️', admin: true },
  { to: '/admin/cities', label: 'Admin Cities', icon: '🏙️', admin: true },
  { to: '/admin/feedback', label: 'Admin Feedback', icon: '📣', admin: true },
]

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const { reduceMotion } = useUI()
  const { isAuthenticated, hasRole } = useAuth()

  const navClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
      isActive ? 'bg-white/10 font-semibold text-white shadow-lg shadow-black/20' : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'
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
      className={`flex h-full flex-col gap-3 bg-slate-950/45 px-3 py-4 backdrop-blur-xl ${
        collapsed ? 'w-16' : 'w-64'
      } ${reduceMotion ? '' : 'transition-[width] duration-200 ease-in-out'}`}
      aria-label="Primary"
    >
      <div className="mb-1 flex items-center justify-between px-1">
        {!collapsed ? <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation</p> : <span />}
        <button
          className="focus-ring rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto" aria-label="Primary navigation">
        {sections.map((section) => (
          <div key={section.label} className="space-y-1">
            {!collapsed ? <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{section.label}</p> : null}
            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.to === '/'}>
                <span aria-hidden className="text-base">{item.icon}</span>
                {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {!collapsed ? <p className="px-2 text-[11px] text-slate-500">Calm surfaces, focused signals.</p> : null}
    </aside>
  )
}

export default Sidebar
