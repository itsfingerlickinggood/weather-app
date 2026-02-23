import Card from '../components/Card'
import { useUI } from '../context/ui'
import { useAuth } from '../context/auth'
import AppIcon from '../components/AppIcon'

const APP_STORAGE_KEYS = [
  'awi_ui', 'awi_pinned_cities', 'awi_tokens',
  'awi_local_users', 'awi_local_session', 'favorites-local',
]

const SwitchRow = ({ title, caption, icon, enabled, onToggle }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-300"><AppIcon name={icon} className="h-4 w-4" /></span>
      <div>
      <p className="type-body text-slate-100">{title}</p>
      <p className="type-caption text-slate-400">{caption}</p>
      </div>
    </div>
    <button
      className={`focus-ring relative h-7 w-12 rounded-full transition ${enabled ? 'bg-blue-500' : 'bg-white/15'}`}
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={`Toggle ${title}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? 'left-6' : 'left-1'}`}
      />
    </button>
  </div>
)

const SettingsPage = () => {
  const { theme, toggleTheme, reduceMotion, toggleMotion, highContrast, toggleContrast } = useUI()
  const { logout } = useAuth()

  const clearSession = () => {
    APP_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
    logout()
  }

  return (
    <div className="space-y-4">
      <section className="space-y-1">
        <p className="section-kicker">Settings</p>
        <h1 className="type-display tracking-tight text-slate-50">Experience preferences</h1>
      </section>

      <Card title="Display" description="Calm visual controls with instant feedback">
        <div className="space-y-2">
          <SwitchRow
            title="Dark mode"
            caption="Use the dark atmospheric appearance"
            icon="moon"
            enabled={theme === 'dark'}
            onToggle={toggleTheme}
          />
          <SwitchRow
            title="Reduce motion"
            caption="Minimize transitions and animated effects"
            icon="clock"
            enabled={reduceMotion}
            onToggle={toggleMotion}
          />
          <SwitchRow
            title="High contrast"
            caption="Increase contrast for readability"
            icon="shield"
            enabled={highContrast}
            onToggle={toggleContrast}
          />
        </div>
      </Card>

      <Card title="Notifications" description="In-app advisories and guidance flow">
        <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
          <p className="type-body text-slate-100 inline-flex items-center gap-2"><AppIcon name="alert" className="h-4 w-4" />Live weather advisories</p>
          <p className="type-caption text-slate-400">Alerts are surfaced as in-app toasts and health center cards.</p>
        </div>
      </Card>

      <Card title="Account" description="Session actions">
        <div className="space-y-2">
          <button className="focus-ring w-full rounded-2xl bg-white/5 px-4 py-3 text-left text-sm text-slate-100" onClick={logout}>
            Logout from this device
            <p className="type-caption text-slate-400">Keep your preferences and local settings.</p>
          </button>
          <button className="focus-ring w-full rounded-2xl bg-red-500/20 px-4 py-3 text-left text-sm text-red-100" onClick={clearSession}>
            Sign out and clear local session
            <p className="type-caption text-red-200/80">Removes stored tokens and local preferences.</p>
          </button>
        </div>
      </Card>
    </div>
  )
}

export default SettingsPage
