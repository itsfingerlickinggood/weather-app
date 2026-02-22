import Card from '../components/Card'
import { useUI } from '../context/ui'
import { useAuth } from '../context/auth'

const APP_STORAGE_KEYS = [
  'awi_ui', 'awi_pinned_cities', 'awi_tokens',
  'awi_local_users', 'awi_local_session', 'favorites-local',
]

const SettingsPage = () => {
  const { theme, toggleTheme, reduceMotion, toggleMotion, highContrast, toggleContrast } = useUI()
  const { logout } = useAuth()

  const clearSession = () => {
    APP_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k))
    logout()
  }

  return (
    <div className="space-y-4">
      <Card title="Display" description="Theme and motion">
        <div className="flex flex-wrap gap-2 text-sm text-slate-200">
          <button className="focus-ring rounded-full bg-white/5 px-3 py-2" onClick={toggleTheme}>
            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
          <button className="focus-ring rounded-full bg-white/5 px-3 py-2" onClick={toggleMotion}>
            Motion: {reduceMotion ? 'Reduced' : 'Normal'}
          </button>
          <button className="focus-ring rounded-full bg-white/5 px-3 py-2" onClick={toggleContrast}>
            Contrast: {highContrast ? 'High' : 'Default'}
          </button>
        </div>
      </Card>

      <Card title="Notifications" description="Local-only toggles">
        <p className="text-sm text-slate-300">Alerts are surfaced as toasts in-app.</p>
      </Card>

      <Card title="Account" description="Manage local session">
        <div className="flex flex-col gap-2 text-sm text-slate-200">
          <button className="focus-ring rounded-full bg-white/5 px-3 py-2" onClick={logout}>
            Logout
          </button>
          <button className="focus-ring rounded-full bg-red-500/20 px-3 py-2 text-red-100" onClick={clearSession}>
            Sign out and clear session
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">Session managed by MongoDB backend. Your preferences are stored in this browser.</p>
      </Card>
    </div>
  )
}

export default SettingsPage
