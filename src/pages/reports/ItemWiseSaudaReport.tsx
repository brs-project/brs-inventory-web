import { useState, useEffect } from 'react'
import {
  format,
  subDays,
  startOfWeek,
  startOfMonth,
} from 'date-fns'
import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react'
import { ReportLayout } from '@components/reports/ReportLayout'
import { ItemWiseSaudaTable } from '@components/reports/ItemWiseSaudaTable'
import { fetchDailyScrapMovement, type DailyScrapMovementRow } from '@/services/reportService'
import { formatWeight } from '@lib/utils'

export function ItemWiseSaudaReport() {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  // Date filters with strict IST constraint
  const [dateFrom, setDateFrom] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState<string>(todayIST)
  const [movements, setMovements] = useState<DailyScrapMovementRow[]>([])
  const [loadingMovements, setLoadingMovements] = useState<boolean>(true)

  useEffect(() => {
    async function loadMovements() {
      try {
        const rows = await fetchDailyScrapMovement()
        setMovements(rows)
      } catch (e) {
        console.error('Error loading daily scrap movement:', e)
      } finally {
        setLoadingMovements(false)
      }
    }
    loadMovements()
  }, [])

  const setQuickRange = (type: 'today' | 'yesterday' | 'this_week' | 'this_month') => {
    const today = new Date()
    if (type === 'today') {
      setDateFrom(todayIST)
      setDateTo(todayIST)
    } else if (type === 'yesterday') {
      const y = format(subDays(today, 1), 'yyyy-MM-dd')
      setDateFrom(y)
      setDateTo(y)
    } else if (type === 'this_week') {
      setDateFrom(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      setDateTo(todayIST)
    } else if (type === 'this_month') {
      setDateFrom(format(startOfMonth(today), 'yyyy-MM-dd'))
      setDateTo(todayIST)
    }
  }

  const handleResetFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    setDateTo(todayIST)
  }

  const filterContent = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Date From
        </label>
        <input
          type="date"
          max={todayIST}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Date To (Max Today IST)
        </label>
        <input
          type="date"
          max={todayIST}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Quick Range Presets
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setQuickRange('today')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setQuickRange('yesterday')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setQuickRange('this_week')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setQuickRange('this_month')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
          >
            This Month
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <ReportLayout
      title="Item-Wise Sauda Rate Summary"
      subtitle="Commercial Sauda agreement rates, deals volume, committed tonnage, and turnover breakdown across metal scrap commodities."
      filterContent={filterContent}
      activeFiltersCount={0}
      onResetFilters={handleResetFilters}
    >
      {/* 1. Item-Wise Sauda Rate Summary Table */}
      <ItemWiseSaudaTable showToolbar={true} />

      {/* 2. Daily Scrap Movement Analytical Section (from view_daily_scrap_movement) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Daily Scrap Physical Movement (Inward Receipts vs Outward Dispatches)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Analytical SQL View: public.view_daily_scrap_movement
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-600 select-none">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Scrap Quality</th>
                <th className="py-2.5 px-3 text-right">Inward Receipt (MT)</th>
                <th className="py-2.5 px-3 text-right">Outward Dispatch (MT)</th>
                <th className="py-2.5 px-3 text-right">Net Day Balance (MT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loadingMovements ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Loading movement history...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No movement records recorded.
                  </td>
                </tr>
              ) : (
                movements.slice(0, 15).map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 px-3 font-mono font-medium text-slate-700">
                      {m.date || '—'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {m.scrap_grade_name || '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                      <span className="inline-flex items-center gap-0.5">
                        <ArrowDownRight className="h-3 w-3 inline text-emerald-500" />
                        {formatWeight(m.inward_receipt_mt)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-amber-700 font-bold">
                      <span className="inline-flex items-center gap-0.5">
                        <ArrowUpRight className="h-3 w-3 inline text-amber-500" />
                        {formatWeight(m.outward_dispatch_mt)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-extrabold text-slate-800">
                      {formatWeight(m.net_day_balance_mt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ReportLayout>
  )
}

export default ItemWiseSaudaReport
