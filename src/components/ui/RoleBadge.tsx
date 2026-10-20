import { cn } from '@lib/utils'

interface RoleBadgeProps {
  role?: string
  className?: string
}

export function RoleBadge({ role = 'viewer', className }: RoleBadgeProps) {
  const normalizedRole = role?.toLowerCase()

  const getBadgeStyle = () => {
    switch (normalizedRole) {
      case 'admin':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
      case 'manager':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800'
      case 'operator':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
      case 'auditor':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
      case 'viewer':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border transition-colors',
        getBadgeStyle(),
        className
      )}
    >
      {role}
    </span>
  )
}

export default RoleBadge
