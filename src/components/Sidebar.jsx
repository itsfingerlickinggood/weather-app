import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useUI } from '../context/ui'
import { useAuth } from '../context/auth'

const items = [
  { to: '/', label: 'Today', icon: '🌤️' },
  { to: '/forecast', label: 'Forecast', icon: '🗓️' },
  { to: '/maps', label: 'Maps & Radar', icon: '🗺️' },
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
    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
      isActive ? 'bg-white/10 text-white shadow-md shadow-black/20' : 'text-slate-200 hover:bg-white/5'
    } ${reduceMotion ? '' : 'duration-150 ease-out'}`

  const visibleItems = [...items, ...adminItems].filter((it) => {
    if (it.admin) return isAuthenticated && hasRole('admin')
    if (it.to === '/saved') return isAuthenticated
    return true
  })

  return (
    <aside
      className={`flex h-full flex-col gap-2 border-r border-white/5 bg-slate-950/70 px-3 py-4 backdrop-blur-xl ${
        collapsed ? 'w-16' : 'w-60'
      } ${reduceMotion ? '' : 'transition-[width] duration-200 ease-in-out'}`}
      aria-label="Primary"
    >
      <button
        className="focus-ring mb-2 self-end rounded-full bg-white/5 px-2 py-1 text-xs text-slate-200"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '›' : '‹'}
      </button>
      <nav className="flex flex-col gap-1" aria-label="Primary navigation">
        {visibleItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={navClass} end={item.to === '/'}>
            <span aria-hidden>{item.icon}</span>
            {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
