import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@lib/utils'

export interface RateInputFieldProps {
  label: string
  required?: boolean
  helperText?: string
  sublabel?: string
  value: number | ''
  onChange: (val: number | '') => void
  placeholder?: string
  prefix?: string
  suffix?: string
  step?: string
  min?: number
  error?: string
  disabled?: boolean
  className?: string
  tabIndex?: number
}

export function RateInputField({
  label,
  required = false,
  helperText,
  sublabel,
  value,
  onChange,
  placeholder = '0.00',
  prefix = '₹',
  suffix = '/kg',
  step = '0.01',
  min = 0,
  error,
  disabled = false,
  className,
  tabIndex,
}: RateInputFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      onChange('')
    } else {
      const num = parseFloat(raw)
      onChange(isNaN(num) ? '' : num)
    }
  }

  return (
    <div className={cn('space-y-1.5 select-none', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {helperText && (
          <span className="text-xs text-slate-400 italic">{helperText}</span>
        )}
      </div>

      <div
        className={cn(
          'flex items-center border rounded-lg overflow-hidden transition-all bg-white',
          disabled && 'bg-slate-50 opacity-70 cursor-not-allowed',
          error
            ? 'border-red-300 ring-2 ring-red-500/10'
            : 'border-slate-300 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-400'
        )}
      >
        {prefix && (
          <span className="px-3 h-10 bg-slate-50 border-r border-slate-200 text-sm font-semibold text-slate-500 flex items-center shrink-0">
            {prefix}
          </span>
        )}

        <input
          type="number"
          step={step}
          min={min}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          tabIndex={tabIndex}
          className="flex-1 h-10 px-3 text-right font-mono font-bold text-sm text-slate-900 border-none outline-none tabular-nums bg-transparent placeholder:text-slate-400 placeholder:font-sans"
        />

        {suffix && (
          <span className="px-3 h-10 bg-slate-50 border-l border-slate-200 text-xs font-semibold text-slate-600 flex items-center shrink-0">
            {suffix}
          </span>
        )}
      </div>

      {sublabel && (
        <p className="text-xs text-slate-400 pt-0.5">{sublabel}</p>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

export default RateInputField
