import { Check, ArrowUpRight, X } from 'lucide-react'
import { formatCurrency, formatMT } from '@lib/billCalculations'

export interface PendingBulkBarProps {
  selectedCount: number
  totalAmount: number
  selectedMT?: number
  onClearSelection: () => void
  onMarkBulkPaid: () => void
}

export function PendingBulkBar({
  selectedCount,
  totalAmount,
  selectedMT = 0,
  onClearSelection,
  onMarkBulkPaid,
}: PendingBulkBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] sm:max-w-2xl w-full px-3">
      <div className="bg-[#111827] text-white px-4 sm:px-6 py-3 sm:py-3.5 rounded-full shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-6 border border-zinc-700/60 backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-200">
        {/* Left: Selection Count + Consignment MT */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="h-3 w-3 stroke-[3]" />
          </div>
          <span className="text-zinc-200">
            <strong className="text-white font-mono">{selectedCount}</strong> {selectedCount === 1 ? 'bill' : 'bills'} selected
            {selectedMT > 0 && (
              <span className="text-zinc-400 ml-1 font-mono text-xs">
                ({formatMT(selectedMT)})
              </span>
            )}
          </span>
        </div>

        {/* Middle: Payable Figure */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
          <span className="text-zinc-400 text-xs hidden md:inline">Total Payable:</span>
          <span className="font-mono font-bold text-amber-400 text-sm sm:text-base tabular-nums">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClearSelection}
            className="text-zinc-400 hover:text-white px-2 py-1 text-xs transition-colors flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Deselect All</span>
          </button>

          <button
            type="button"
            onClick={onMarkBulkPaid}
            className="bg-white hover:bg-zinc-100 text-zinc-950 font-semibold px-4 py-1.5 rounded-full transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Execute Batch RTGS</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
