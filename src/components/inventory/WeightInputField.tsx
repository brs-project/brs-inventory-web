import React, { forwardRef } from 'react'
import { Scale } from 'lucide-react'
import { cn } from '@lib/utils'

export interface WeightInputFieldProps {
  label: string
  name: string
  value?: number | string
  onChange?: (value: number | undefined) => void
  onBlur?: () => void
  placeholder?: string
  hint?: string
  error?: string
  disabled?: boolean
  required?: boolean
  className?: string
  id?: string
  min?: number
  step?: string | number
}

export const WeightInputField = forwardRef<HTMLInputElement, WeightInputFieldProps>(
  (
    {
      label,
      name,
      value,
      onChange,
      onBlur,
      placeholder = '0.000',
      hint,
      error,
      disabled = false,
      required = false,
      className,
      id,
      min = 0,
      step = '0.001',
      ...props
    },
    ref
  ) => {
    const inputId = id || `weight-input-${name}`

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawVal = e.target.value
      if (rawVal === '') {
        onChange?.(undefined)
      } else {
        const parsed = parseFloat(rawVal)
        onChange?.(isNaN(parsed) ? undefined : parsed)
      }
    }

    return (
      <div className={cn('w-full select-none space-y-1.5', className)}>
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-slate-500 uppercase tracking-wide"
          >
            {label} {required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          {hint && <span className="text-xs text-slate-400 italic">{hint}</span>}
        </div>

        <div
          className={cn(
            'flex items-center border border-slate-300 rounded-lg overflow-hidden transition-colors duration-150 bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500',
            error && 'border-red-300 focus-within:ring-red-500/20 focus-within:border-red-500',
            disabled && 'bg-slate-50 opacity-60 cursor-not-allowed'
          )}
        >
          <Scale className="ml-3 w-4 h-4 text-slate-400 shrink-0" />

          <input
            ref={ref}
            id={inputId}
            name={name}
            type="number"
            min={min}
            step={step}
            value={value === undefined || value === null ? '' : value}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder}
            className="flex-1 h-10 px-2.5 text-right font-mono font-medium text-sm text-slate-900 border-none outline-none bg-transparent placeholder:text-slate-400"
            {...props}
          />

          <span className="px-3 h-10 flex items-center bg-slate-100 border-l border-slate-200 text-xs font-semibold text-slate-600 shrink-0 select-none">
            MT
          </span>
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium animate-in fade-in duration-150">
            {error}
          </p>
        )}
      </div>
    )
  }
)

WeightInputField.displayName = 'WeightInputField'

export default WeightInputField
