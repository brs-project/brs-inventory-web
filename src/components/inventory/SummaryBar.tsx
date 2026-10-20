import { Layers, ArrowDownCircle, ArrowUpCircle, Package, Scale } from 'lucide-react'
import { cn } from '@lib/utils'

export interface SummaryBarProps {
  totalCount: number
  totalInward: number
  totalGodown: number
  totalVariance: number
  totalOutward: number
  netStock: number
  className?: string
}

export function SummaryBar({
  totalCount,
  totalInward,
  totalVariance,
  totalOutward,
  netStock,
  className,
}: SummaryBarProps) {
  const isVarianceLoss = totalVariance > 0
  const isVarianceExcess = totalVariance < 0

  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 select-none mb-4',
        className
      )}
    >
      {/* 1. Records */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
          <Layers className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            RECORDS
          </p>
          <p className="text-base sm:text-lg font-bold font-mono text-slate-800 tracking-tight truncate">
            {totalCount}{' '}
            <span className="text-[11px] font-normal text-slate-400">
              {totalCount === 1 ? 'entry' : 'entries'}
            </span>
          </p>
        </div>
      </div>

      {/* 2. Total Inward */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
          <ArrowDownCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            TOTAL INWARD
          </p>
          <p className="text-base sm:text-lg font-bold font-mono text-sky-600 tracking-tight truncate">
            {totalInward.toFixed(3)}{' '}
            <span className="text-[11px] font-medium text-sky-400">MT</span>
          </p>
        </div>
      </div>

      {/* 3. Cumulative Variance */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
            isVarianceLoss
              ? 'bg-amber-50 text-amber-600'
              : isVarianceExcess
              ? 'bg-blue-50 text-blue-600'
              : 'bg-emerald-50 text-emerald-600'
          )}
        >
          <Scale className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            VARIANCE
          </p>
          <p
            className={cn(
              'text-base sm:text-lg font-bold font-mono tracking-tight truncate',
              isVarianceLoss
                ? 'text-amber-600'
                : isVarianceExcess
                ? 'text-blue-600'
                : 'text-emerald-600'
            )}
          >
            {totalVariance > 0 ? `+${totalVariance.toFixed(3)}` : totalVariance.toFixed(3)}{' '}
            <span className="text-[11px] font-medium opacity-70">MT</span>
          </p>
        </div>
      </div>

      {/* 4. Total Outward */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
          <ArrowUpCircle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            TOTAL OUTWARD
          </p>
          <p className="text-base sm:text-lg font-bold font-mono text-amber-600 tracking-tight truncate">
            {totalOutward.toFixed(3)}{' '}
            <span className="text-[11px] font-medium text-amber-400">MT</span>
          </p>
        </div>
      </div>

      {/* 5. Net Stock Retained */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs flex items-center gap-3 col-span-2 sm:col-span-1">
        <div
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
            netStock >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          )}
        >
          <Package className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 truncate">
            NET RETAINED
          </p>
          <p
            className={cn(
              'text-base sm:text-lg font-bold font-mono tracking-tight truncate',
              netStock >= 0 ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {netStock > 0 ? `+${netStock.toFixed(3)}` : netStock.toFixed(3)}{' '}
            <span className="text-[11px] font-medium opacity-70">MT</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SummaryBar
