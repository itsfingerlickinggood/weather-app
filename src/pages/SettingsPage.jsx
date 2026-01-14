import Card from '../components/Card'
import { useUI } from '../context/ui'
import { useAuth } from '../context/auth'
import { USERS_KEY, SESSION_KEY } from '../localUsers'

const SettingsPage = () => {
  const { theme, toggleTheme, reduceMotion, toggleMotion, highContrast, toggleContrast } = useUI()
  const { logout } = useAuth()

  const clearLocalAccounts = () => {
    localStorage.removeItem(USERS_KEY)
    localStorage.removeItem(SESSION_KEY)
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
          <button className="focus-ring rounded-full bg-red-500/20 px-3 py-2 text-red-100" onClick={clearLocalAccounts}>
            Delete local account data
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">All data is stored locally in your browser.</p>
      </Card>
    </div>
  )
}

export default SettingsPage
