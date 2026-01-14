import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth'

const AdminRoute = () => {
  const { isAuthenticated, hasRole, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="p-6 text-center text-sm text-slate-300">Checking session…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!hasRole('admin')) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminRoute
