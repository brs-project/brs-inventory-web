import { CheckCircle, Search, Plus, ArrowLeft, RotateCcw } from 'lucide-react'

export interface PendingEmptyStateProps {
  isFiltered: boolean
  onResetFilters?: () => void
  onViewAllBills?: () => void
  onAddBill?: () => void
}

export function PendingEmptyState({
  isFiltered,
  onResetFilters,
  onViewAllBills,
  onAddBill,
}: PendingEmptyStateProps) {
  if (isFiltered) {
    return (
      <div className="py-16 px-4 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
          <Search className="h-5 w-5" />
        </div>
        <h3 className="text-base font-bold text-[#111827] mb-1">
          No settlement slips match your criteria
        </h3>
        <p className="text-xs text-[#4B5563] max-w-sm mx-auto mb-5">
          Try clearing your search keyword, adjusting the aging threshold, or switching the quality grade filter.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-2xs transition-all active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="py-20 px-4 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 mb-4 shadow-2xs">
        <CheckCircle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-[#111827] mb-1">
        All RTGS Settlements Cleared
      </h3>
      <p className="text-xs text-[#4B5563] max-w-md mx-auto mb-6">
        Calm treasury status. There are currently no pending under-billing differences or outstanding supplier adjustments awaiting settlement.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {onViewAllBills && (
          <button
            type="button"
            onClick={onViewAllBills}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#111827] text-xs font-semibold rounded-lg shadow-2xs transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>View All Bills</span>
          </button>
        )}
        {onAddBill && (
          <button
            type="button"
            onClick={onAddBill}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-2xs transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Record New Bill</span>
          </button>
        )}
      </div>
    </div>
  )
}
