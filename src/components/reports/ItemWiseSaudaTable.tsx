import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  RefreshCw,
  Search,
  IndianRupee,
  Layers,
  Scale,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react'
import { fetchItemWiseSaudaSummary, type ItemWiseSaudaSummaryRow } from '@/services/reportService'
import { exportToCSV } from '@lib/exportCSV'
import { cn } from '@lib/utils'

export interface ItemWiseSaudaTableProps {
  className?: string
  showToolbar?: boolean
}

export function ItemWiseSaudaTable({
  className,
  showToolbar = true,
}: ItemWiseSaudaTableProps) {
  const [data, setData] = useState<ItemWiseSaudaSummaryRow[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const rows = await fetchItemWiseSaudaSummary()
      setData(rows)
    } catch (err: any) {
      console.error('Error loading sauda summary:', err)
      setError(err?.message || 'Failed to load item-wise sauda summary from database')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtered rows
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data
    const q = searchQuery.toLowerCase().trim()
    return data.filter(
      (r) =>
        (r.scrap_grade_name || '').toLowerCase().includes(q) ||
        (r.hsn_code || '').toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  // Aggregated totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => {
        acc.totalDeals += row.total_deals
        acc.totalQuantityMt += row.total_quantity_mt
        acc.totalTurnoverInr += row.total_sauda_value_inr
        acc.totalRtgsDiff += row.total_rtgs_difference_inr
        return acc
      },
      { totalDeals: 0, totalQuantityMt: 0, totalTurnoverInr: 0, totalRtgsDiff: 0 }
    )
  }, [filteredData])

  const overallAvgRate =
    totals.totalQuantityMt > 0
      ? totals.totalTurnoverInr / totals.totalQuantityMt
      : 0

  const handleExportCSV = () => {
    const exportRows = filteredData.map((row) => ({
      'Scrap Quality': row.scrap_grade_name || '—',
      'HSN Code': row.hsn_code || '7204',
      'Total Deals': row.total_deals,
      'Total Quantity (MT)': row.total_quantity_mt.toFixed(3),
      'Weighted Avg Sauda Rate (INR)': row.weighted_avg_sauda_rate.toFixed(2),
      'Min Sauda Rate (INR)': row.min_sauda_rate.toFixed(2),
      'Max Sauda Rate (INR)': row.max_sauda_rate.toFixed(2),
      'Total Sauda Turnover (INR)': row.total_sauda_value_inr.toFixed(2),
      'Total RTGS Difference (INR)': row.total_rtgs_difference_inr.toFixed(2),
    }))
    exportToCSV(exportRows, 'Item_Wise_Sauda_Rate_Summary')
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Visual Badge & Controls Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Requirement Badge: Rates reflect commercial Sauda agreement */}
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs select-none">
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
          <span>Rates reflect commercial Sauda agreement (excluding GST invoice bill rate)</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            title="Refresh Sauda Data"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin text-blue-600')} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            title="Export CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      {showToolbar && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-blue-500" />
              Scrap Grades Placed
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
              {filteredData.length} Grades
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              Total Sauda Deals
            </span>
            <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">
              {totals.totalDeals} Deals
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Scale className="h-3.5 w-3.5 text-amber-500" />
              Total Committed Tonnage
            </span>
            <span className="text-lg font-bold font-mono text-amber-800 mt-0.5 block">
              {totals.totalQuantityMt.toFixed(3)} <span className="text-xs font-normal">MT</span>
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5 text-purple-500" />
              Total Sauda Turnover
            </span>
            <span className="text-lg font-bold font-mono text-purple-900 mt-0.5 block">
              ₹{totals.totalTurnoverInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Search Filter Strip */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by scrap quality name or HSN code..."
          className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Item-Wise Sauda Rate Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-600 select-none">
                <th className="py-3 px-4">Scrap Quality</th>
                <th className="py-3 px-4 text-center">Total Deals</th>
                <th className="py-3 px-4 text-right">Total Quantity (MT)</th>
                <th className="py-3 px-4 text-right">Weighted Avg Sauda Rate (₹)</th>
                <th className="py-3 px-4 text-center">Price Range (Min – Max)</th>
                <th className="py-3 px-4 text-right">Total Sauda Turnover (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                      <span>Loading analytical commercial view from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No commercial sauda records found in view_item_wise_sauda_summary.
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const minFormatted = row.min_sauda_rate.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                  const maxFormatted = row.max_sauda_rate.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                  const avgFormatted = row.weighted_avg_sauda_rate.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                  const turnoverFormatted = row.total_sauda_value_inr.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })

                  return (
                    <tr
                      key={row.scrap_grade_name || idx}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* 1. Scrap Quality */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {row.scrap_grade_name || 'Unspecified Grade'}
                          </span>
                          {row.hsn_code && (
                            <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              HSN: {row.hsn_code}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Total Deals */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {row.total_deals} {row.total_deals === 1 ? 'deal' : 'deals'}
                        </span>
                      </td>

                      {/* 3. Total Quantity (MT) - 3 decimals */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {row.total_quantity_mt.toFixed(3)} <span className="text-[10px] text-slate-500 font-normal">MT</span>
                      </td>

                      {/* 4. Weighted Avg Sauda Rate (₹) */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        ₹{avgFormatted} <span className="text-[10px] text-slate-500 font-normal">/ MT</span>
                      </td>

                      {/* 5. Price Range (Min – Max) */}
                      <td className="py-3 px-4 text-center font-mono text-[11px] font-semibold text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          ₹{minFormatted} – ₹{maxFormatted}
                        </span>
                      </td>

                      {/* 6. Total Sauda Turnover (₹) */}
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                        ₹{turnoverFormatted}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>

            {/* Grand Totals Footer */}
            {filteredData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-xs text-slate-900 select-none">
                  <td className="py-3 px-4">
                    Grand Total ({filteredData.length} Grades)
                  </td>
                  <td className="py-3 px-4 text-center text-blue-800 font-mono">
                    {totals.totalDeals} Deals
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-900">
                    {totals.totalQuantityMt.toFixed(3)} MT
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-800">
                    ₹{overallAvgRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / MT
                  </td>
                  <td className="py-3 px-4 text-center text-slate-500 text-[11px]">
                    —
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-purple-900 text-sm">
                    ₹{totals.totalTurnoverInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}

export default ItemWiseSaudaTable
