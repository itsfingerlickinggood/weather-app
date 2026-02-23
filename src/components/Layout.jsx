import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'
import { useUI } from '../context/ui'
import ToastCenter from './ToastCenter'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MobileNav from './MobileNav'

const Layout = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const { highContrast } = useUI()
  const offline = typeof navigator !== 'undefined' && navigator?.onLine === false
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isAuthRoute = location.pathname === '/login'
  const showChrome = isAuthenticated && !isAuthRoute

  // Auth pages (login) render without any chrome — clean full-screen canvas
  if (isAuthRoute) {
    return (
      <>
        {children}
        <ToastCenter />
      </>
    )
  }

  return (
    <div className={`min-h-screen text-slate-100 ${highContrast ? 'contrast-boost' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div className="grid min-h-screen grid-cols-[auto,1fr]">
        <div className={`hidden md:block ${showChrome ? '' : 'md:hidden'}`}>
          <Sidebar />
        </div>
        <div className="flex min-h-screen flex-col">
          {showChrome ? <TopBar onOpenMenu={() => setMobileMenuOpen(true)} mobileMenuOpen={mobileMenuOpen} /> : null}
          {showChrome && offline ? (
            <div className="bg-amber-500/20 px-4 py-2 text-sm text-amber-100">Offline mode: showing cached data where available.</div>
          ) : null}
          <main id="main-content" className="mx-auto flex-1 w-full max-w-7xl px-4 pb-24 pt-5 md:px-5 md:pb-16 md:pt-6">
            {children}
          </main>
        </div>
      </div>
      {showChrome ? <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} /> : null}
      <ToastCenter />
    </div>
  )
}

export default Layout
