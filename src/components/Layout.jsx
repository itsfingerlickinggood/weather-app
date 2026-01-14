import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useUI } from '../context/ui'
import ToastCenter from './ToastCenter'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const { highContrast } = useUI()
  const offline = typeof navigator !== 'undefined' && navigator?.onLine === false

  return (
    <div className={`min-h-screen text-slate-100 ${highContrast ? 'contrast-boost' : ''}`}>
      <div className="grid min-h-screen grid-cols-[auto,1fr]">
        <Sidebar />
        <div className="flex min-h-screen flex-col">
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/70 px-4 py-3 backdrop-blur-xl">
            <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="rounded-lg bg-blue-500/20 px-2 py-1 text-xs uppercase text-blue-100">Climate</span>
              <span>Kerala Climate Studio</span>
            </Link>
          </div>
          <TopBar />
          {offline ? (
            <div className="bg-amber-500/20 px-4 py-2 text-sm text-amber-100">Offline mode: showing cached data where available.</div>
          ) : null}
          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 flex-1">{children}</main>
        </div>
      </div>
      <ToastCenter />
    </div>
  )
}

export default Layout
