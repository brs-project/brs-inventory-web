import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Menu,
  Calendar,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Keyboard,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '@hooks/useAuth'
import { RoleBadge } from '@components/ui/RoleBadge'

export interface TopbarProps {
  onMenuClick: () => void
  onOpenSearch?: () => void
  onOpenNotifications?: () => void
  unreadNotificationCount?: number
  onOpenHelp?: () => void
}

export function Topbar({
  onMenuClick,
  onOpenSearch,
  onOpenNotifications,
  unreadNotificationCount = 4,
  onOpenHelp,
}: TopbarProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate dynamic Page Title and Breadcrumb hierarchy
  const getRouteInfo = (pathname: string) => {
    if (pathname.startsWith('/inventory/edit')) {
      return { title: 'Edit Transaction', section: 'Inventory', current: 'Edit Entry' }
    }
    if (pathname.startsWith('/dispatch/edit')) {
      return { title: 'Edit Dispatch', section: 'Dispatch', current: 'Edit Entry' }
    }
    if (pathname.startsWith('/billing/edit')) {
      return { title: 'Edit Bill', section: 'Billing', current: 'Edit Entry' }
    }

    switch (pathname) {
      case '/dashboard':
        return { title: 'Dashboard', section: 'Home', current: 'Overview' }
      case '/master':
        return { title: 'Master Data Hub', section: 'Master Data', current: 'Master Hub' }
      case '/master/transporters':
        return { title: 'Transporters Master', section: 'Master Data', current: 'Transporters' }
      case '/master/parties':
        return { title: 'Party Master', section: 'Master Data', current: 'Parties' }
      case '/master/qualities':
        return { title: 'Quality Master', section: 'Master Data', current: 'Qualities' }
      case '/master/transports':
      case '/master/vehicles':
        return { title: 'Vehicles & Transports', section: 'Master Data', current: 'Transports' }
      case '/inventory/add':
        return { title: 'Add Transaction', section: 'Inventory', current: 'Add New' }
      case '/inventory/list':
        return { title: 'View Transactions', section: 'Inventory', current: 'History & Entries' }
      case '/dispatch/add':
        return { title: 'Add Dispatch Entry', section: 'Dispatch', current: 'Add Entry' }
      case '/dispatch/list':
        return { title: 'Dispatch Sheet', section: 'Dispatch', current: 'Sheet & History' }
      case '/billing/add':
        return { title: 'Add Bill Entry', section: 'Billing', current: 'Add Entry' }
      case '/billing/list':
        return { title: 'View Bills', section: 'Billing', current: 'All Bills' }
      case '/billing/pending':
        return { title: 'Pending RTGS Payments', section: 'Billing', current: 'Pending RTGS' }
      case '/reports/daily':
        return { title: 'Daily Report', section: 'Reports', current: 'Daily Summary' }
      case '/reports/stock':
        return { title: 'Stock Report', section: 'Reports', current: 'Godown Balances' }
      case '/reports/party':
        return { title: 'Party Report', section: 'Reports', current: 'Party Ledger' }
      case '/reports/vehicle':
        return { title: 'Vehicle Report', section: 'Reports', current: 'Lorry In/Out' }
      case '/settings/users':
        return { title: 'User Management', section: 'Settings', current: 'Users & Roles' }
      case '/settings/app':
        return { title: 'App Settings', section: 'Settings', current: 'Configuration' }
      default:
        return { title: 'Inventory Manager', section: 'Home', current: 'Page' }
    }
  }

  const routeInfo = getRouteInfo(location.pathname)

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const currentDateFormatted = format(new Date(), 'EEE, dd MMM yyyy')

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30 shrink-0 select-none">
      {/* =========================================================================
          LEFT: Hamburger Menu (Mobile) + Dynamic Page Title & Breadcrumb
      ========================================================================= */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open Navigation Menu"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight">
            {routeInfo.title}
          </h1>

          {/* Breadcrumb below title on desktop */}
          <nav className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Link to="/dashboard" className="hover:text-blue-600 transition">
              Home
            </Link>
            {routeInfo.section !== 'Home' && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-300" />
                <span className="text-slate-500">{routeInfo.section}</span>
              </>
            )}
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-600 font-semibold">{routeInfo.current}</span>
          </nav>
        </div>
      </div>

      {/* =========================================================================
          RIGHT: Global Search, Date Display, Help, Notification Bell, User Dropdown
      ========================================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* a) Global Search Trigger Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 transition text-xs font-semibold cursor-pointer border border-slate-200/60"
          title="Search anything (Ctrl+K)"
        >
          <Search className="h-4 w-4 text-slate-400" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 font-bold shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* b) Date Display (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-blue-600" />
          <span>{currentDateFormatted}</span>
        </div>

        {/* c) Keyboard Shortcuts Trigger */}
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer hidden sm:flex"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-4 w-4" />
          </button>
        )}

        {/* d) Notification Bell Trigger */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notifications"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <Bell className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              {unreadNotificationCount}
            </span>
          )}
        </button>

        {/* c) User Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-sm ring-2 ring-blue-100">
              {getInitials(user?.full_name)}
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {user?.full_name || 'Admin User'}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {user?.role || 'admin'}
              </span>
            </div>

            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </button>

          {/* User Dropdown Content */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.full_name || 'Admin User'}
                </p>
                <div className="mt-1">
                  <RoleBadge role={user?.role || 'admin'} />
                </div>
              </div>

              <div className="space-y-0.5 text-xs font-medium">
                <Link
                  to="/settings/users"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  <User className="h-4 w-4 text-slate-500" />
                  <span>Profile</span>
                </Link>

                <Link
                  to="/settings/app"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
                >
                  <Settings className="h-4 w-4 text-slate-500" />
                  <span>App Settings</span>
                </Link>

                <div className="border-t border-slate-100 my-1 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false)
                      signOut()
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition font-semibold cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar
