import { useState } from 'react'
import { AlertTriangle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@lib/utils'

export interface ErrorStateProps {
  error?: string | Error | null
  onRetry?: () => void
  title?: string
  className?: string
}

export function ErrorState({
  error,
  onRetry,
  title = 'Something went wrong',
  className,
}: ErrorStateProps) {
  const [showDetails, setShowDetails] = useState(false)
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'An unexpected error occurred while loading data.'
  const errorStack = error instanceof Error ? error.stack : undefined

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-rose-200/80 shadow-xs space-y-4',
        className
      )}
    >
      <div className="h-16 w-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shadow-xs ring-4 ring-rose-50/50">
        <AlertTriangle className="h-8 w-8 text-rose-600" />
      </div>

      <div className="max-w-md space-y-1.5">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          {errorMessage}
        </p>
      </div>

      {errorStack && (
        <div className="w-full max-w-lg text-left">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
            {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {showDetails && (
            <pre className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[10px] overflow-x-auto max-h-40 leading-normal">
              {errorStack}
            </pre>
          )}
        </div>
      )}

      {onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/25 transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ErrorState
