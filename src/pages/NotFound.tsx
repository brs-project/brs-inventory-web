import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Package, Sparkles } from 'lucide-react'

export function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Background Animated Floating Boxes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/6 w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl animate-bounce duration-1000 flex items-center justify-center">
          <Package className="h-8 w-8 text-blue-500/40" />
        </div>
        <div className="absolute bottom-1/3 right-1/6 w-20 h-20 bg-purple-500/10 border border-purple-500/20 rounded-2xl animate-pulse duration-700 flex items-center justify-center">
          <Package className="h-10 w-10 text-purple-500/40" />
        </div>
        <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-bounce duration-1000 delay-300 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-amber-500/40" />
        </div>
      </div>

      {/* Center Card */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-2xl text-center space-y-6 relative z-10 animate-in zoom-in-95 duration-200">
        {/* Big 404 Display */}
        <div className="space-y-1">
          <div className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 tracking-tighter">
            404
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Page Not Found
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto pt-1">
            The page you are looking for might have been moved, renamed, or doesn&apos;t exist in the system.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-blue-600/25 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-slate-400" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 pt-2 font-medium">
          BRS Scrap Metals &bull; Enterprise Inventory Suite
        </div>
      </div>
    </div>
  )
}

export default NotFound
