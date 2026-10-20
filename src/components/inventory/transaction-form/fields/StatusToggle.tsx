import { cn } from '@lib/utils'

export interface StatusToggleProps {
  value: 'completed' | 'draft'
  onChange: (value: 'completed' | 'draft') => void
  disabled?: boolean
}

export function StatusToggle({ value, onChange, disabled = false }: StatusToggleProps) {
  return (
    <div className="space-y-1.5 select-none">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          RECORD STATUS
        </label>
        <span className="text-xs text-slate-400 italic">Entry lifecycle</span>
      </div>

      <div className="inline-flex bg-slate-100 rounded-lg p-1 gap-1 w-full border border-slate-200/80">
        {/* Draft Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('draft')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer',
            value === 'draft'
              ? 'bg-white text-amber-700 shadow-xs border border-amber-200'
              : 'text-slate-500 hover:text-slate-800',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              value === 'draft' ? 'bg-amber-500' : 'bg-slate-300'
            )}
          />
          <span>Draft</span>
        </button>

        {/* Completed Option */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange('completed')}
          className={cn(
            'flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer',
            value === 'completed'
              ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
              : 'text-slate-500 hover:text-slate-800',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <span
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              value === 'completed' ? 'bg-emerald-500' : 'bg-slate-300'
            )}
          />
          <span>Completed</span>
        </button>
      </div>
    </div>
  )
}

export default StatusToggle
