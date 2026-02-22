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
          <div className="flex items-center justify-between bg-slate-900/35 px-5 py-3 backdrop-blur-xl">
            <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight text-slate-100">
              <span className="rounded-xl bg-blue-500/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-100">Climate</span>
              <span className="text-base">Kerala Climate Studio</span>
            </Link>
          </div>
          <TopBar />
          {offline ? (
            <div className="bg-amber-500/20 px-4 py-2 text-sm text-amber-100">Offline mode: showing cached data where available.</div>
          ) : null}
          <main className="mx-auto flex-1 w-full max-w-7xl px-5 pb-20 pt-8">{children}</main>
        </div>
      </div>
      <ToastCenter />
    </div>
  )
}

export default Layout
