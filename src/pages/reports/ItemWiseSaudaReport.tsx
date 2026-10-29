import { useState } from 'react'
import {
  format,
  subDays,
  startOfWeek,
  startOfMonth,
} from 'date-fns'
import { ReportLayout } from '@components/reports/ReportLayout'
import { ItemWiseSaudaTable } from '@components/reports/ItemWiseSaudaTable'

export function ItemWiseSaudaReport() {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  // Date filters with strict IST constraint
  const [dateFrom, setDateFrom] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState<string>(todayIST)

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
      {/* Item-Wise Sauda Rate Summary Table */}
      <ItemWiseSaudaTable showToolbar={true} />
    </ReportLayout>
  )
}

export default ItemWiseSaudaReport
