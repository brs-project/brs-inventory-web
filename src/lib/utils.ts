import { type ClassValue, clsx } from 'clsx'
import { format, parseISO, isValid } from 'date-fns'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind and conditional class names safely
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats a numeric weight value to 3 decimal places with " MT" suffix.
 * Example: 25.4 -> "25.400 MT"
 */
export function formatWeight(value: number): string {
  const numericValue = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0
  return `${numericValue.toFixed(3)} MT`
}

/**
 * Formats a date string to DD/MM/YYYY.
 * Example: "2026-09-14" -> "14/09/2026"
 */
export function formatDate(date: string | Date): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isValid(d) ? format(d, 'dd/MM/yyyy') : String(date)
  } catch {
    return String(date)
  }
}

/**
 * Formats a datetime string to DD/MM/YYYY HH:mm.
 * Example: "2026-09-14T14:30:00" -> "14/09/2026 14:30"
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isValid(d) ? format(d, 'dd/MM/yyyy HH:mm') : String(date)
  } catch {
    return String(date)
  }
}

/**
 * Returns Tailwind color utility classes according to transaction/record status.
 */
export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'active':
    case 'success':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800'
    case 'draft':
    case 'pending':
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
    case 'cancelled':
    case 'inactive':
    case 'danger':
    case 'failed':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  }
}

/**
 * Returns Tailwind color utility classes for user role badges.
 */
export function getRoleBadgeColor(role: string): string {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800'
    case 'manager':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800'
    case 'operator':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
    case 'auditor':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
    case 'viewer':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
  }
}
