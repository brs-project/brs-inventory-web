import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Package,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@hooks/useAuth'

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isLoading, error, setError } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@inventory.local',
      password: 'password123',
      rememberMe: true,
    },
  })

  // Get destination route if redirected from a protected page
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard'

  const onSubmit = async (data: LoginFormData) => {
    try {
      const user = await signIn(data.email, data.password)
      toast.success(`Welcome back, ${user.full_name}!`)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in. Please try again.'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white font-sans antialiased text-slate-900">
      {/* =========================================================================
          LEFT HALF: Desktop Branding & Value Proposition (#1E3A5F)
      ========================================================================= */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1E3A5F] text-white flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        {/* Subtle decorative background gradient circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding Section */}
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 shadow-xl mb-6 ring-1 ring-white/10">
            <Package className="h-10 w-10 text-blue-300" />
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            Inventory Manager
          </h1>
          <p className="text-xl text-blue-200/90 font-medium tracking-wide">
            Track. Manage. Export.
          </p>
        </div>

        {/* Middle Feature Highlights */}
        <div className="relative z-10 my-auto py-10">
          <p className="text-xs uppercase font-semibold text-blue-300/80 tracking-wider mb-6">
            Enterprise Godown &amp; Weighbridge Suite
          </p>
          <ul className="space-y-5">
            <li className="flex items-start gap-4">
              <div className="mt-1 p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white text-base block">
                  Real-time inventory tracking
                </span>
                <span className="text-sm text-slate-300 font-normal">
                  Live inward/outward weight variance calculation with godown balance updates.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div className="mt-1 p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white text-base block">
                  Multi-format export (Excel, PDF, CSV)
                </span>
                <span className="text-sm text-slate-300 font-normal">
                  1-click financial audit-ready reports and dispatch lorry challans.
                </span>
              </div>
            </li>

            <li className="flex items-start gap-4">
              <div className="mt-1 p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="font-semibold text-white text-base block">
                  Role-based access control
                </span>
                <span className="text-sm text-slate-300 font-normal">
                  Granular permission layers for Admins, Godown Incharges, and Weighbridge Operators.
                </span>
              </div>
            </li>
          </ul>
        </div>

        {/* Bottom Left Footer / System Status */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/70">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Industrial Weighbridge Cluster Online</span>
          </div>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT HALF: Clean Login Form
      ========================================================================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 xl:p-24 overflow-y-auto">
        {/* Mobile Header View */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-[#1E3A5F] rounded-xl text-white shadow-md">
            <Package className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">Inventory Manager</h2>
            <p className="text-xs text-slate-500 font-medium">Track. Manage. Export.</p>
          </div>
        </div>

        {/* Main Form Box */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-600">
              Sign in to your account to manage your godowns and transactions
            </p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Failed</span>
                <span className="text-xs text-red-600">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-700 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  placeholder="you@company.com"
                  {...register('email')}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border text-sm text-slate-900 rounded-xl transition duration-150 ease-in-out focus:outline-none focus:bg-white ${
                    errors.email
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full pl-10 pr-11 py-2.5 bg-slate-50 border text-sm text-slate-900 rounded-xl transition duration-150 ease-in-out focus:outline-none focus:bg-white ${
                    errors.password
                      ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 font-medium">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold tracking-wide transition duration-150 ease-in-out shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick Demo Hint */}
          <div className="mt-8 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700 block">Quick Demo Credentials:</span>
            <div>&bull; Default login: <code className="text-blue-600 font-mono">admin@inventory.local</code> / <code className="text-blue-600 font-mono">password123</code></div>
            <div>&bull; Disabled test: <code className="text-slate-600 font-mono">disabled@user.com</code></div>
          </div>
        </div>

        {/* Footer Copyright */}
        <footer className="w-full max-w-md mx-auto text-center text-xs text-slate-400 pt-6">
          &copy; 2026 Inventory Manager. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

export default Login
