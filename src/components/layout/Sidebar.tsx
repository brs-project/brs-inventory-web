import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Package,
  LayoutDashboard,
  Users,
  Award,
  PlusCircle,
  ClipboardList,
  ArrowUpFromLine,
  Send,
  Receipt,
  FileSpreadsheet,
  CreditCard,
  Calendar,
  Boxes,
  UserCheck,
  Truck,
  UserCog,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { RoleBadge } from '@components/ui/RoleBadge'
import { cn } from '@lib/utils'

interface NavItem {
  label: string
  path: string
  icon: ReactNode
  adminOnly?: boolean
}

interface NavGroup {
  groupTitle?: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ],
  },
  {
    groupTitle: 'MASTER DATA',
    items: [
      {
        label: 'Parties',
        path: '/master/parties',
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: 'Qualities',
        path: '/master/qualities',
        icon: <Award className="h-4 w-4" />,
      },
    ],
  },
  {
    groupTitle: 'INVENTORY',
    items: [
      {
        label: 'Add Transaction',
        path: '/inventory/add',
        icon: <PlusCircle className="h-4 w-4" />,
      },
      {
        label: 'View Transactions',
        path: '/inventory/list',
        icon: <ClipboardList className="h-4 w-4" />,
      },
    ],
  },
  {
    groupTitle: 'DISPATCH',
    items: [
      {
        label: 'Add Dispatch',
        path: '/dispatch/add',
        icon: <ArrowUpFromLine className="h-4 w-4" />,
      },
      {
        label: 'Dispatch Sheet',
        path: '/dispatch/list',
        icon: <Send className="h-4 w-4" />,
      },
    ],
  },
  {
    groupTitle: 'BILLING',
    items: [
      {
        label: 'Add Bill Entry',
        path: '/billing/add',
        icon: <Receipt className="h-4 w-4" />,
      },
      {
        label: 'Bill Sheet',
        path: '/billing/list',
        icon: <FileSpreadsheet className="h-4 w-4" />,
      },
      {
        label: 'Pending RTGS',
        path: '/billing/pending',
        icon: <CreditCard className="h-4 w-4" />,
      },
    ],
  },
  {
    groupTitle: 'REPORTS',
    items: [
      {
        label: 'Daily Report',
        path: '/reports/daily',
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        label: 'Stock Report',
        path: '/reports/stock',
        icon: <Boxes className="h-4 w-4" />,
      },
      {
        label: 'Party Report',
        path: '/reports/party',
        icon: <UserCheck className="h-4 w-4" />,
      },
      {
        label: 'Vehicle Report',
        path: '/reports/vehicle',
        icon: <Truck className="h-4 w-4" />,
      },
    ],
  },
  {
    groupTitle: 'SETTINGS',
    items: [
      {
        label: 'User Management',
        path: '/settings/users',
        icon: <UserCog className="h-4 w-4" />,
        adminOnly: true,
      },
      {
        label: 'App Settings',
        path: '/settings/app',
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
]

interface SidebarProps {
  onItemClick?: () => void
  className?: string
}

export function Sidebar({ onItemClick, className }: SidebarProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'admin'

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  return (
    <aside
      className={cn(
        'w-60 h-screen bg-[#0C0E14] text-white flex flex-col justify-between select-none border-r border-[#1C202E] shrink-0 font-sans',
        className
      )}
    >
      {/* 1. BRAND HEADER (PINNED TOP, 56px / h-14) */}
      <div className="h-14 px-4 flex items-center gap-3 border-b border-[#1C202E] shrink-0 bg-[#0C0E14]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20 shrink-0">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-semibold text-white tracking-tight leading-tight truncate">
            Inventory Manager
          </span>
          <span className="text-[9.5px] font-bold text-[#8B90A0] tracking-[0.08em] leading-none mt-0.5 uppercase">
            Enterprise OS
          </span>
        </div>
      </div>

      {/* 2. SCROLLABLE NAVIGATION LIST (Ultra-thin custom scrollbar) */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5 sidebar-scroll">
        {NAV_GROUPS.map((group, groupIdx) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin)
          if (visibleItems.length === 0) return null

          return (
            <div key={groupIdx} className="space-y-0.5">
              {group.groupTitle && (
                <div className="px-2.5 pb-1 text-[10px] font-semibold text-[#4D5266] tracking-[0.08em] uppercase">
                  {group.groupTitle}
                </div>
              )}

              <nav className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path))

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onItemClick}
                      className={cn(
                        'flex items-center gap-2.5 px-2.5 h-[34px] rounded-md text-[13px] tracking-[-0.01em] transition-all duration-150 group relative',
                        isActive
                          ? 'bg-white/[0.08] text-white font-semibold shadow-2xs'
                          : 'text-[#8B90A0] hover:bg-white/[0.04] hover:text-white font-medium'
                      )}
                    >
                      {/* Active Indicator Accent Line */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#3B82F6]" />
                      )}

                      <span
                        className={cn(
                          'shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-[#8B90A0] group-hover:text-white'
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          )
        })}
      </div>

      {/* 3. PINNED USER DOCK (PINNED BOTTOM, 56px / h-14) */}
      <div className="h-14 px-3 border-t border-[#1C202E] bg-[#0C0E14] shrink-0 flex items-center justify-between gap-2">
        {/* User Identity Stack */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center ring-1 ring-white/20 shrink-0 shadow-2xs font-mono">
            {getInitials(user?.full_name)}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {user?.full_name || 'Admin User'}
            </p>
            <div className="mt-0.5 flex items-center">
              <RoleBadge role={user?.role || 'admin'} />
            </div>
          </div>
        </div>

        {/* Quiet Sign Out Trigger */}
        <button
          type="button"
          onClick={() => {
            if (onItemClick) onItemClick()
            signOut()
          }}
          title="Sign Out"
          aria-label="Sign Out"
          className="w-7 h-7 rounded-md flex items-center justify-center text-[#8B90A0] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
