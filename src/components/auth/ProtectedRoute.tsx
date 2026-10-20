import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AlertOctagon, LogOut, ShieldAlert } from 'lucide-react'
import { useAuthStore } from '@store/authStore'

interface ProtectedRouteProps {
  children?: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, clearUser } = useAuthStore()
  const location = useLocation()

  // 1. If not authenticated, redirect to /login preserving intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. If user account is marked as inactive/disabled
  if (!user.is_active) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 shadow-xl text-center">
          <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-red-50">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Disabled</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your account ({user.full_name}) has been deactivated by the system administrator. Please contact IT support or your operations manager to restore access.
          </p>

          <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2 text-xs text-red-700 text-left mb-6">
            <AlertOctagon className="h-4 w-4 shrink-0 text-red-600" />
            <span>Status: Inactive &bull; Role: {user.role.toUpperCase()}</span>
          </div>

          <button
            onClick={() => clearUser()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition shadow-md shadow-slate-900/10"
          >
            <LogOut className="h-4 w-4" />
            Sign Out to Continue
          </button>
        </div>
      </div>
    )
  }

  // 3. Authenticated and active
  return <>{children}</>
}

export default ProtectedRoute
