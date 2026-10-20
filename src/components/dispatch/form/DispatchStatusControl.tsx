import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { cn } from '@lib/utils'

export type DispatchStatus = 'dispatched' | 'draft' | 'cancelled'

export interface DispatchStatusControlProps {
  value: DispatchStatus
  onChange: (status: DispatchStatus) => void
  disabled?: boolean
  className?: string
}

export function DispatchStatusControl({
  value,
  onChange,
  disabled = false,
  className,
}: DispatchStatusControlProps) {
  return (
    <div className={cn('space-y-1.5 select-none', className)}>
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block">
        STATUS
      </label>

      <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1 w-full border border-slate-200/80">
        {/* Dispatched option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('dispatched')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2.5 rounded-md cursor-pointer transition-all duration-150',
            value === 'dispatched'
              ? 'bg-white text-green-700 shadow-2xs border border-green-200 font-semibold'
              : 'text-slate-500 hover:text-slate-800 bg-transparent'
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span>Dispatched</span>
        </button>

        {/* Draft option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('draft')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2.5 rounded-md cursor-pointer transition-all duration-150',
            value === 'draft'
              ? 'bg-white text-amber-700 shadow-2xs border border-amber-200 font-semibold'
              : 'text-slate-500 hover:text-slate-800 bg-transparent'
          )}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Draft</span>
        </button>

        {/* Cancelled option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('cancelled')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-2.5 rounded-md cursor-pointer transition-all duration-150',
            value === 'cancelled'
              ? 'bg-white text-red-700 shadow-2xs border border-red-200 font-semibold'
              : 'text-slate-500 hover:text-slate-800 bg-transparent'
          )}
        >
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          <span>Cancelled</span>
        </button>
      </div>
    </div>
  )
}

export default DispatchStatusControl
