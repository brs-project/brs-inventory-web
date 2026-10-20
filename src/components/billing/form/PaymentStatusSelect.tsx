import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, AlertCircle } from 'lucide-react'
import { cn } from '@lib/utils'

export type PaymentStatusType = 'pending' | 'paid' | 'partial' | 'na'

export interface PaymentStatusOption {
  value: PaymentStatusType
  label: string
  sublabel: string
  dotColor: string
  badgeBg: string
  badgeText: string
}

export const PAYMENT_STATUS_OPTIONS: PaymentStatusOption[] = [
  {
    value: 'pending',
    label: 'Pending',
    sublabel: 'Awaiting RTGS payment',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800',
  },
  {
    value: 'paid',
    label: 'Paid',
    sublabel: 'RTGS payment completed',
    dotColor: 'bg-green-500',
    badgeBg: 'bg-green-50 border-green-200',
    badgeText: 'text-green-800',
  },
  {
    value: 'partial',
    label: 'Partial',
    sublabel: 'Partially settled balance',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-800',
  },
  {
    value: 'na',
    label: 'N/A',
    sublabel: 'Exact rate (No adjustment)',
    dotColor: 'bg-slate-400',
    badgeBg: 'bg-slate-100 border-slate-200',
    badgeText: 'text-slate-700',
  },
]

export interface PaymentStatusSelectProps {
  value: PaymentStatusType
  onChange: (val: PaymentStatusType) => void
  disabled?: boolean
  error?: string
  className?: string
}

export function PaymentStatusSelect({
  value,
  onChange,
  disabled = false,
  error,
  className,
}: PaymentStatusSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedOption =
    PAYMENT_STATUS_OPTIONS.find((opt) => opt.value === value) ||
    PAYMENT_STATUS_OPTIONS[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('space-y-1.5 relative select-none', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          PAYMENT STATUS <span className="text-red-500">*</span>
        </label>
      </div>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            'w-full h-10 px-3 border rounded-lg flex items-center justify-between transition-colors bg-white cursor-pointer focus:outline-none text-sm',
            disabled && 'bg-slate-50 cursor-not-allowed opacity-70',
            error
              ? 'border-red-300 ring-2 ring-red-500/10'
              : open
              ? 'border-amber-400 ring-2 ring-amber-500/20'
              : 'border-slate-300 hover:border-amber-300'
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full shrink-0',
                selectedOption.dotColor
              )}
            />
            <span className="font-semibold text-slate-900 text-xs sm:text-sm">
              {selectedOption.label}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              ({selectedOption.sublabel})
            </span>
          </div>

          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 transition-transform duration-200',
              open && 'rotate-180 text-amber-600'
            )}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-1 animate-in fade-in zoom-in-95 duration-150">
            {PAYMENT_STATUS_OPTIONS.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left flex items-center justify-between text-xs transition cursor-pointer hover:bg-amber-50/60',
                    isSelected && 'bg-amber-50/90 font-bold text-amber-900'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn('w-2.5 h-2.5 rounded-full', opt.dotColor)}
                    />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {opt.label}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {opt.sublabel}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  )
}

export default PaymentStatusSelect
