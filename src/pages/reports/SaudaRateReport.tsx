import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  TrendingUp,
  Download,
  Search,
  Layers,
  Calendar,
  RotateCw,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react'
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/services/supabaseClient'
import { exportToCSV } from '@lib/exportCSV'
import { cn } from '@lib/utils'

export interface SaudaReportItem {
  qualityGradeId: string | null
  scrapGradeName: string
  hsnCode: string
  totalDeals: number
  totalVolumeMt: number
  minSaudaRate: number
  maxSaudaRate: number
  weightedAvgSaudaRate: number
  totalTurnoverValue: number
}

interface DetailDeal {
  billDate: string
  qualityGradeId: string | null
  itemName: string
  hsnCode: string
  qty: number
  saudaRate: number
  turnoverValue: number
}

export function SaudaRateReport() {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const startOfMonthIST = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  const [loading, setLoading] = useState<boolean>(true)
  const [deals, setDeals] = useState<DetailDeal[]>([])
  const [gradesList, setGradesList] = useState<{ id: string; name: string }[]>([])

  // Filters
  const [selectedGrade, setSelectedGrade] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>(startOfMonthIST)
  const [dateTo, setDateTo] = useState<string>(todayIST)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Load data from Supabase
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [detailsRes, gradesRes] = await Promise.all([
        supabase
          .from('view_rate_difference_details')
          .select('bill_date, quality_grade_id, item_name, hsn_code, qty, sauda_rate')
          .order('bill_date', { ascending: false }),
        supabase.from('quality_grades').select('id, name').order('name'),
      ])

      if (detailsRes.error) throw detailsRes.error

      const mappedDeals: DetailDeal[] = (detailsRes.data || []).map((row) => {
        const qty = Number(row.qty || 0)
        const saudaRate = Number(row.sauda_rate || 0)
        return {
          billDate: row.bill_date || '',
          qualityGradeId: row.quality_grade_id || null,
          itemName: row.item_name || 'Scrap Material',
          hsnCode: row.hsn_code || '7204',
          qty,
          saudaRate,
          turnoverValue: qty * saudaRate,
        }
      })

      setDeals(mappedDeals)
      if (gradesRes.data) setGradesList(gradesRes.data)
    } catch (err: any) {
      console.error('Error fetching Sauda report data:', err)
      toast.error('Failed to load Sauda rate report', {
        description: err.message || 'Check database connectivity',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Quick Date Range Presets
  const applyDatePreset = (preset: 'today' | 'yesterday' | 'this_week' | 'this_month') => {
    const today = new Date()
    if (preset === 'today') {
      setDateFrom(todayIST)
      setDateTo(todayIST)
    } else if (preset === 'yesterday') {
      const y = format(subDays(today, 1), 'yyyy-MM-dd')
      setDateFrom(y)
      setDateTo(y)
    } else if (preset === 'this_week') {
      setDateFrom(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      setDateTo(todayIST)
    } else if (preset === 'this_month') {
      setDateFrom(startOfMonthIST)
      setDateTo(todayIST)
    }
  }

  // Filtered individual deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // Date filter
      if (dateFrom && deal.billDate < dateFrom) return false
      if (dateTo && deal.billDate > dateTo) return false

      // Grade filter
      if (selectedGrade !== 'all') {
        if (
          deal.qualityGradeId !== selectedGrade &&
          deal.itemName.toLowerCase() !== selectedGrade.toLowerCase()
        ) {
          return false
        }
      }

      // Free text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match =
          deal.itemName.toLowerCase().includes(q) ||
          deal.hsnCode.toLowerCase().includes(q) ||
          deal.billDate.includes(q)
        if (!match) return false
      }

      return true
    })
  }, [deals, dateFrom, dateTo, selectedGrade, searchQuery])

  // Aggregated table rows grouped by item/scrap grade
  const aggregatedRows = useMemo(() => {
    const map = new Map<
      string,
      {
        qualityGradeId: string | null
        scrapGradeName: string
        hsnCode: string
        totalDeals: number
        totalVolumeMt: number
        rates: number[]
        totalTurnoverValue: number
      }
    >()

    filteredDeals.forEach((deal) => {
      const key = deal.itemName
      if (!map.has(key)) {
        map.set(key, {
          qualityGradeId: deal.qualityGradeId,
          scrapGradeName: deal.itemName,
          hsnCode: deal.hsnCode,
          totalDeals: 0,
          totalVolumeMt: 0,
          rates: [],
          totalTurnoverValue: 0,
        })
      }
      const item = map.get(key)!
      item.totalDeals += 1
      item.totalVolumeMt += deal.qty
      item.rates.push(deal.saudaRate)
      item.totalTurnoverValue += deal.turnoverValue
    })

    return Array.from(map.values())
      .map((item): SaudaReportItem => {
        const minSaudaRate = item.rates.length > 0 ? Math.min(...item.rates) : 0
        const maxSaudaRate = item.rates.length > 0 ? Math.max(...item.rates) : 0
        const weightedAvgSaudaRate =
          item.totalVolumeMt > 0 ? item.totalTurnoverValue / item.totalVolumeMt : 0

        return {
          qualityGradeId: item.qualityGradeId,
          scrapGradeName: item.scrapGradeName,
          hsnCode: item.hsnCode,
          totalDeals: item.totalDeals,
          totalVolumeMt: item.totalVolumeMt,
          minSaudaRate,
          maxSaudaRate,
          weightedAvgSaudaRate,
          totalTurnoverValue: item.totalTurnoverValue,
        }
      })
      .sort((a, b) => b.totalTurnoverValue - a.totalTurnoverValue)
  }, [filteredDeals])

  // Top KPI Summary Cards
  const kpis = useMemo(() => {
    let totalDeals = 0
    let totalVolume = 0
    let totalTurnover = 0

    aggregatedRows.forEach((r) => {
      totalDeals += r.totalDeals
      totalVolume += r.totalVolumeMt
      totalTurnover += r.totalTurnoverValue
    })

    const weightedAvgSaudaRate = totalVolume > 0 ? totalTurnover / totalVolume : 0

    return {
      totalDeals,
      totalVolume,
      weightedAvgSaudaRate,
      totalTurnover,
    }
  }, [aggregatedRows])

  // Export to CSV
  const handleExportCSV = () => {
    if (aggregatedRows.length === 0) {
      toast.warning('No data available to export')
      return
    }

    const exportData = aggregatedRows.map((r) => ({
      'Item / Scrap Grade': r.scrapGradeName,
      'HSN Code': r.hsnCode,
      'Total Deals': r.totalDeals,
      'Total Volume (MT)': r.totalVolumeMt.toFixed(3),
      'Min Sauda Rate (INR/MT)': r.minSaudaRate.toFixed(2),
      'Max Sauda Rate (INR/MT)': r.maxSaudaRate.toFixed(2),
      'Weighted Avg Sauda Rate (INR/MT)': r.weightedAvgSaudaRate.toFixed(2),
      'Total Turnover Value (INR)': r.totalTurnoverValue.toFixed(2),
    }))

    exportToCSV(exportData, `Sauda_Rate_Report_${dateFrom}_to_${dateTo}`)
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* =========================================================================
          PAGE HEADER & ACTIONS
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Item-Wise Sauda Rate Report
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Scrap grade turnover, weighted average deal rates, and commercial rate analytics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RotateCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-2xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 1: 4 TOP KPI SUMMARY CARDS
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Deals */}
        <div className="p-4.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Total Sauda Deals
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
              {kpis.totalDeals}
            </span>
            <span className="text-xs font-semibold text-zinc-400">Deals</span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Executed sauda agreements
          </p>
        </div>

        {/* KPI 2: Total Volume (MT) */}
        <div className="p-4.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Total Volume (MT)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
              {kpis.totalVolume.toFixed(3)}
            </span>
            <span className="text-xs font-bold text-zinc-500">MT</span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Total committed scrap tonnage
          </p>
        </div>

        {/* KPI 3: Weighted Average Sauda Rate */}
        <div className="p-4.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Weighted Avg Sauda Rate
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
              ₹{kpis.weightedAvgSaudaRate.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-zinc-500">/MT</span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Turnover-weighted commercial rate
          </p>
        </div>

        {/* KPI 4: Total Sauda Turnover Value */}
        <div className="p-4.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Total Turnover Value
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              ₹{kpis.totalTurnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Total commercial sauda value
          </p>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: FILTER TOOLBAR
      ========================================================================= */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
          {/* Scrap Grade Dropdown */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              <span>Scrap Grade</span>
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Scrap Grades ({gradesList.length})</option>
              {gradesList.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From (max={todayIST}) */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>From Date</span>
            </label>
            <input
              type="date"
              max={todayIST}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono"
            />
          </div>

          {/* Date To (max={todayIST}) */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>To Date (Max Today IST)</span>
            </label>
            <input
              type="date"
              max={todayIST}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono"
            />
          </div>

          {/* Search Input */}
          <div className="relative">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <span>Search</span>
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search grade or HSN..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider mr-1">
            Quick Dates:
          </span>
          <button
            type="button"
            onClick={() => applyDatePreset('today')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => applyDatePreset('yesterday')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => applyDatePreset('this_week')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => applyDatePreset('this_month')}
            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition cursor-pointer"
          >
            This Month
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: DATA TABLE
      ========================================================================= */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-semibold">Loading Sauda rate analytics...</p>
        </div>
      ) : aggregatedRows.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <FileSpreadsheet className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Sauda Deals Found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            No transactions match the selected filters or date range.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Item / Scrap Grade Name</th>
                  <th className="py-3 px-3 text-center">HSN Code</th>
                  <th className="py-3 px-3 text-right">Total Deals</th>
                  <th className="py-3 px-4 text-right">Total Volume (MT)</th>
                  <th className="py-3 px-4 text-right">Min Sauda Rate (₹)</th>
                  <th className="py-3 px-4 text-right">Max Sauda Rate (₹)</th>
                  <th className="py-3 px-4 text-right">Weighted Avg Rate (₹)</th>
                  <th className="py-3 px-4 text-right">Total Turnover Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {aggregatedRows.map((row) => (
                  <tr
                    key={row.scrapGradeName}
                    className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                      {row.scrapGradeName}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-zinc-500">
                      {row.hsnCode}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                      {row.totalDeals}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {row.totalVolumeMt.toFixed(3)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-600">
                      ₹{row.minSaudaRate.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-600">
                      ₹{row.maxSaudaRate.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      ₹{row.weightedAvgSaudaRate.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                      ₹{row.totalTurnoverValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Sticky Grand Totals Footer Row */}
              <tfoot>
                <tr className="bg-zinc-100 dark:bg-zinc-800/80 font-black border-t-2 border-zinc-300 dark:border-zinc-700">
                  <td colSpan={2} className="py-3.5 px-4 uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Grand Totals ({aggregatedRows.length} Grades)
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono">{kpis.totalDeals}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-900 dark:text-zinc-100">
                    {kpis.totalVolume.toFixed(3)}
                  </td>
                  <td colSpan={2}></td>
                  <td className="py-3.5 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                    ₹{kpis.weightedAvgSaudaRate.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{kpis.totalTurnover.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default SaudaRateReport
