import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@lib/utils'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  master: 'Master Data',
  parties: 'Parties & Suppliers',
  qualities: 'Qualities & Grades',
  inventory: 'Inventory',
  add: 'Add Transaction',
  list: 'All Transactions',
  edit: 'Edit Transaction',
  reports: 'Reports',
  daily: 'Daily Summary',
  stock: 'Stock Report',
  party: 'Party Ledger',
  vehicle: 'Vehicle Movement',
  settings: 'Settings',
  users: 'User Management',
  app: 'Application Settings',
  billing: 'Billing',
  pending: 'Pending RTGS',
  dispatch: 'Dispatch',
}

export function Breadcrumb({ className }: { className?: string }) {
  const location = useLocation()
  const pathSegments = location.pathname.split('/').filter(Boolean)

  if (pathSegments.length === 0 || location.pathname === '/dashboard') {
    return null
  }

  // Generate crumb objects
  const crumbs = pathSegments.map((segment, index) => {
    const to = `/${pathSegments.slice(0, index + 1).join('/')}`
    const isLast = index === pathSegments.length - 1
    const label = ROUTE_LABELS[segment] || segment

    return {
      to,
      label,
      isLast,
    }
  })

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center gap-1.5 text-xs text-slate-500 select-none overflow-x-auto pb-1',
        className
      )}
    >
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1 font-medium hover:text-blue-600 transition shrink-0"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {crumbs.map((crumb, idx) => (
        <div key={crumb.to || idx} className="inline-flex items-center gap-1.5 shrink-0">
          <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          {crumb.isLast ? (
            <span className="font-bold text-slate-800">{crumb.label}</span>
          ) : (
            <Link
              to={crumb.to}
              className="font-medium text-slate-500 hover:text-blue-600 transition"
            >
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

export default Breadcrumb
