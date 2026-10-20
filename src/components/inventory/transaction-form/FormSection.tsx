import React from 'react'
import { cn } from '@lib/utils'

export interface FormSectionProps {
  title: string
  subtitle?: string
  dotColor?: string
  badgeText?: string
  badgeColor?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  subtitle,
  dotColor = 'bg-blue-500',
  badgeText,
  badgeColor = 'bg-blue-50 text-blue-600 border border-blue-200/60',
  children,
  className,
}: FormSectionProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200',
        className
      )}
    >
      {/* Section Header Strip */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-3 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', dotColor)} />
          <h3 className="text-sm font-semibold text-slate-800 tracking-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <span className="text-xs text-slate-400 hidden sm:inline truncate">
              {subtitle}
            </span>
          )}
        </div>

        {badgeText && (
          <span
            className={cn(
              'text-[10px] sm:text-xs font-semibold uppercase tracking-wider rounded px-2.5 py-0.5 shrink-0 select-none',
              badgeColor
            )}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Section Content Area */}
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

export default FormSection
