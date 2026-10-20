import { useState, type ReactNode } from 'react'
import { format } from 'date-fns'
import {
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Printer,
} from 'lucide-react'
import { PageHeader } from '@components/ui/PageHeader'
import { cn } from '@lib/utils'

export interface ReportLayoutProps {
  title: string
  subtitle: string
  filterContent: ReactNode
  children: ReactNode
  onGenerateReport?: () => void
  isGenerating?: boolean
  onResetFilters?: () => void
  activeFiltersCount?: number
  defaultFiltersOpen?: boolean
}

export function ReportLayout({
  title,
  subtitle,
  filterContent,
  children,
  onGenerateReport,
  isGenerating = false,
  onResetFilters,
  activeFiltersCount = 0,
  defaultFiltersOpen,
}: ReportLayoutProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(() => {
    if (defaultFiltersOpen !== undefined) return defaultFiltersOpen
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 select-none">
      {/* Printable Banner (Visible ONLY on print) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
              BRS METALS ENTERPRISE — {title}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Weighbridge &amp; Godown Inventory Ledger Report
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-bold text-slate-900">
              Generated: {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
            <p>Authorized Audit Copy</p>
          </div>
        </div>
      </div>

      {/* Screen Header (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <PageHeader title={title} subtitle={subtitle} />

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Collapsible Filter Card (Hidden on print) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 no-print">
        {/* Filter Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <Filter className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
              Report Parameters &amp; Aggregations
            </span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                {activeFiltersCount} active
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer px-2 py-1 rounded-lg hover:bg-slate-100"
          >
            <span>{isFilterOpen ? 'Hide Filters' : 'Show Filters'}</span>
            {isFilterOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Filter Content & Actions */}
        {isFilterOpen && (
          <div className="p-5 space-y-5 animate-in fade-in-50 duration-150">
            {filterContent}

            {/* Filter Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {activeFiltersCount > 0 ? (
                  <span>
                    Parameters are customized. Click <strong className="text-slate-700">Generate Report</strong> to recalculate.
                  </span>
                ) : (
                  <span>Using standard date and quality parameters.</span>
                )}
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-auto">
                {onResetFilters && (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                )}

                {onGenerateReport && (
                  <button
                    type="button"
                    onClick={onGenerateReport}
                    disabled={isGenerating}
                    className={cn(
                      'inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition cursor-pointer',
                      isGenerating
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-600/25'
                    )}
                  >
                    <Sparkles className={cn('h-4 w-4', isGenerating && 'animate-spin')} />
                    <span>{isGenerating ? 'Recalculating...' : 'Generate Report'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Report Children Slot */}
      <div className="space-y-6">{children}</div>
    </div>
  )
}

export default ReportLayout
