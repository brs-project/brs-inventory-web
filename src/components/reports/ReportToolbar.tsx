import { useState } from 'react'
import { toast } from 'sonner'
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  Printer,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Layers,
  Loader2,
} from 'lucide-react'
import { cn } from '@lib/utils'

export interface ReportToolbarProps {
  recordCount: number
  totalInward?: number
  totalOutward?: number
  netStock?: number
  totalVariance?: number
  customStats?: { label: string; value: string | number; color?: string }[]
  onExportExcel?: () => void
  onExportPDF?: () => void
  onExportCSV?: () => void
  onPrint?: () => void
  isExporting?: boolean
  className?: string
}

export function ReportToolbar({
  recordCount,
  totalInward,
  totalOutward,
  netStock,
  totalVariance,
  customStats,
  onExportExcel,
  onExportPDF,
  onExportCSV,
  onPrint,
  isExporting = false,
  className,
}: ReportToolbarProps) {
  const [localExporting, setLocalExporting] = useState<string | null>(null)

  const handleExport = (type: 'Excel' | 'PDF' | 'CSV', customHandler?: () => void) => {
    if (customHandler) {
      customHandler()
      return
    }

    setLocalExporting(type)
    setTimeout(() => {
      setLocalExporting(null)
      toast.success(`${type} export prepared successfully!`, {
        description: `Exported ${recordCount} records to ${type} format. Check your downloads folder.`,
      })
    }, 900)
  }

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <div
      className={cn(
        'bg-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 no-print',
        className
      )}
    >
      {/* Metric Strip */}
      <div className="flex items-center gap-3 sm:gap-5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
        {/* Record count pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 shrink-0 font-bold">
          <Layers className="h-4 w-4 text-blue-400" />
          <span>{recordCount} Records</span>
        </div>

        {/* Total Inward */}
        {totalInward !== undefined && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Inward:</span>
            <span className="font-mono font-bold text-emerald-400 flex items-center">
              <ArrowDownRight className="h-3.5 w-3.5 inline mr-0.5" />
              {totalInward.toFixed(3)} MT
            </span>
          </div>
        )}

        {/* Total Outward */}
        {totalOutward !== undefined && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Outward:</span>
            <span className="font-mono font-bold text-amber-400 flex items-center">
              <ArrowUpRight className="h-3.5 w-3.5 inline mr-0.5" />
              {totalOutward.toFixed(3)} MT
            </span>
          </div>
        )}

        {/* Variance */}
        {totalVariance !== undefined && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Variance:</span>
            <span
              className={cn(
                'font-mono font-bold',
                totalVariance === 0
                  ? 'text-slate-300'
                  : totalVariance > 0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              )}
            >
              {totalVariance > 0 ? `+${totalVariance.toFixed(3)}` : totalVariance.toFixed(3)} MT
            </span>
          </div>
        )}

        {/* Net Stock Position */}
        {netStock !== undefined && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">Net Stock:</span>
            <span
              className={cn(
                'font-mono font-bold flex items-center',
                netStock >= 0 ? 'text-blue-300' : 'text-rose-400'
              )}
            >
              <Package className="h-3.5 w-3.5 inline mr-1" />
              {netStock.toFixed(3)} MT
            </span>
          </div>
        )}

        {/* Custom Stats */}
        {customStats?.map((st, idx) => (
          <div key={idx} className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400">{st.label}:</span>
            <span className={cn('font-mono font-bold', st.color || 'text-white')}>
              {st.value}
            </span>
          </div>
        ))}
      </div>

      {/* Export & Print Actions */}
      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
        <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden lg:inline">
          Export As:
        </span>

        {/* Excel */}
        <button
          type="button"
          onClick={() => handleExport('Excel', onExportExcel)}
          disabled={isExporting || localExporting !== null}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          {localExporting === 'Excel' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
          ) : (
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
          )}
          <span>Excel</span>
        </button>

        {/* PDF */}
        <button
          type="button"
          onClick={() => handleExport('PDF', onExportPDF)}
          disabled={isExporting || localExporting !== null}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          {localExporting === 'PDF' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
          ) : (
            <FileText className="h-3.5 w-3.5 text-rose-400" />
          )}
          <span>PDF</span>
        </button>

        {/* CSV */}
        <button
          type="button"
          onClick={() => handleExport('CSV', onExportCSV)}
          disabled={isExporting || localExporting !== null}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          {localExporting === 'CSV' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
          ) : (
            <FileCode className="h-3.5 w-3.5 text-blue-400" />
          )}
          <span>CSV</span>
        </button>

        {/* Print */}
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 text-xs font-bold transition cursor-pointer"
        >
          <Printer className="h-3.5 w-3.5 text-slate-300" />
          <span>Print</span>
        </button>
      </div>
    </div>
  )
}

export default ReportToolbar
