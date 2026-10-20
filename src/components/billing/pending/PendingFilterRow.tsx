import { Filter, RotateCcw, CheckSquare, Layers } from 'lucide-react'
import { cn } from '@lib/utils'

export interface QualityOption {
  id: string
  quality_name: string
  category?: string
}

export interface PendingFilterRowProps {
  qualityFilter: string
  onQualityChange: (qualityId: string) => void
  agedFilter: string
  onAgedChange: (aged: string) => void
  qualities: QualityOption[]
  onResetFilters: () => void
  hasActiveFilters: boolean
  filteredCount?: number
  selectedCount?: number
  onToggleSelectAll?: () => void
  isAllSelected?: boolean
}

export function PendingFilterRow({
  qualityFilter,
  onQualityChange,
  agedFilter,
  onAgedChange,
  qualities,
  onResetFilters,
  hasActiveFilters,
  filteredCount,
  selectedCount = 0,
  onToggleSelectAll,
  isAllSelected = false,
}: PendingFilterRowProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Filter Indicators / Selection Helper */}
      <div className="flex items-center gap-2">
        {onToggleSelectAll && filteredCount !== undefined && filteredCount > 0 && (
          <button
            type="button"
            onClick={onToggleSelectAll}
            className={cn(
              'px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors shadow-2xs',
              isAllSelected
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-slate-50 hover:text-[#111827]'
            )}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>
              {isAllSelected ? 'Deselect All' : `Select All Filtered (${filteredCount})`}
            </span>
          </button>
        )}

        {selectedCount > 0 && (
          <span className="text-[11px] font-mono text-slate-500 font-medium hidden sm:inline">
            {selectedCount} of {filteredCount} selected
          </span>
        )}
      </div>

      {/* Right: Dropdowns + Reset Button */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Quality Grade Dropdown */}
        <div className="relative min-w-[150px]">
          <select
            value={qualityFilter}
            onChange={(e) => onQualityChange(e.target.value)}
            className="w-full h-8 pl-2.5 pr-7 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-black/15 shadow-2xs cursor-pointer appearance-none"
          >
            <option value="all">Quality Grade: All</option>
            {qualities.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quality_name} {q.category ? `(${q.category})` : ''}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Layers className="h-3 w-3" />
          </div>
        </div>

        {/* Aging Bracket Dropdown */}
        <div className="relative min-w-[150px]">
          <select
            value={agedFilter}
            onChange={(e) => onAgedChange(e.target.value)}
            className="w-full h-8 pl-2.5 pr-7 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111827] focus:outline-none focus:ring-1 focus:ring-black/15 shadow-2xs cursor-pointer appearance-none"
          >
            <option value="all">Aging Bracket: All</option>
            <option value="critical">&gt; 15d Critical</option>
            <option value="warning">7–15d Moderate</option>
            <option value="fresh">&lt; 7d Fresh</option>
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Filter className="h-3 w-3" />
          </div>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-[#4B5563] hover:text-[#111827] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            title="Reset active filters"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  )
}
