import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@lib/utils'

export interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
  icon: ReactNode
  color: 'blue' | 'red' | 'green' | 'amber' | 'purple' | 'slate'
  trend?: 'up' | 'down'
  trendValue?: string
  isLoading?: boolean
}

export function KPICard({
  title,
  value,
  unit,
  subtitle,
  icon,
  color,
  trend,
  trendValue,
  isLoading,
}: KPICardProps) {
  const getColorStyles = () => {
    switch (color) {
      case 'blue':
        return {
          iconBg: 'bg-blue-50 text-blue-600 ring-4 ring-blue-50/50',
          accent: 'text-blue-600',
        }
      case 'red':
        return {
          iconBg: 'bg-red-50 text-red-600 ring-4 ring-red-50/50',
          accent: 'text-red-600',
        }
      case 'green':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/50',
          accent: 'text-emerald-600',
        }
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-600 ring-4 ring-amber-50/50',
          accent: 'text-amber-600',
        }
      case 'purple':
        return {
          iconBg: 'bg-purple-50 text-purple-600 ring-4 ring-purple-50/50',
          accent: 'text-purple-600',
        }
      case 'slate':
      default:
        return {
          iconBg: 'bg-slate-100 text-slate-600 ring-4 ring-slate-100/50',
          accent: 'text-slate-600',
        }
    }
  }

  const styles = getColorStyles()

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 rounded-xl bg-slate-200" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-32 bg-slate-200 rounded" />
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between select-none">
      <div className="flex items-start justify-between gap-4 mb-4">
        {/* Left Side: Icon in colored circle */}
        <div
          className={cn(
            'h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition',
            styles.iconBg
          )}
        >
          {icon}
        </div>

        {/* Right Side: Title & Value */}
        <div className="text-right flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate mb-1">
            {title}
          </p>
          <div className="flex items-baseline justify-end gap-1.5 flex-wrap">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              {value}
            </span>
            {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
          </div>
        </div>
      </div>

      {/* Bottom Row: Subtitle and Trend indicator */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        {subtitle && <span className="text-slate-500 font-medium">{subtitle}</span>}

        {trendValue && (
          <div
            className={cn(
              'flex items-center gap-1 font-semibold ml-auto',
              trend === 'up'
                ? 'text-emerald-600'
                : trend === 'down'
                ? 'text-red-600'
                : 'text-slate-600'
            )}
          >
            {trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
            {trend === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default KPICard
