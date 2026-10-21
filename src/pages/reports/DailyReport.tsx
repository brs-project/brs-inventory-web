import { useState, useMemo } from 'react'
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  TrendingUp,
} from 'lucide-react'
import { ReportLayout } from '@components/reports/ReportLayout'
import { ReportToolbar } from '@components/reports/ReportToolbar'
import { ReportTable, type ReportColumn, type ReportTotalsCell } from '@components/reports/ReportTable'
import { ItemWiseSaudaTable } from '@components/reports/ItemWiseSaudaTable'
import { useParties, useQualities, useGodowns } from '@hooks/useMasterData'
import { useDailyReport, type DailyReportFilters } from '@hooks/useReports'
import { exportToExcel } from '@lib/exportExcel'
import { exportToPDF } from '@lib/exportPDF'
import { exportToCSV } from '@lib/exportCSV'
import {
  getDailyReportExcelConfig,
  getDailyReportPDFConfig,
  prepareTransactionExportRows,
} from '@lib/reportConfigs'
import { cn } from '@lib/utils'
import type { InventoryTransaction } from '@types'

export function DailyReport() {
  const { parties } = useParties()
  const { qualities } = useQualities()
  const { godowns } = useGodowns()

  // Default to 1st of month to today
  const [dateFrom, setDateFrom] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedParties, setSelectedParties] = useState<string[]>([])
  const [selectedQualities, setSelectedQualities] = useState<string[]>([])
  const [selectedGodown, setSelectedGodown] = useState<string>('all')
  const [activeReportTab, setActiveReportTab] = useState<'weighbridge' | 'sauda'>('weighbridge')
  const [groupBy, setGroupBy] = useState<'none' | 'quality' | 'godown'>('none')

  // Quick Range Helper
  const setQuickRange = (type: 'today' | 'yesterday' | 'this_week' | 'this_month') => {
    const today = new Date()
    if (type === 'today') {
      const d = format(today, 'yyyy-MM-dd')
      setDateFrom(d)
      setDateTo(d)
    } else if (type === 'yesterday') {
      const y = format(subDays(today, 1), 'yyyy-MM-dd')
      setDateFrom(y)
      setDateTo(y)
    } else if (type === 'this_week') {
      setDateFrom(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      setDateTo(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
    } else if (type === 'this_month') {
      setDateFrom(format(startOfMonth(today), 'yyyy-MM-dd'))
      setDateTo(format(endOfMonth(today), 'yyyy-MM-dd'))
    }
  }

  // Active filter count calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedParties.length > 0) count++
    if (selectedQualities.length > 0) count++
    if (selectedGodown !== 'all') count++
    if (groupBy !== 'none') count++
    return count
  }, [selectedParties, selectedQualities, selectedGodown, groupBy])

  // Filters object passed to hook
  const filters: DailyReportFilters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      partyIds: selectedParties.length > 0 ? selectedParties : undefined,
      qualityIds: selectedQualities.length > 0 ? selectedQualities : undefined,
      godownId: selectedGodown,
      groupBy,
    }),
    [dateFrom, dateTo, selectedParties, selectedQualities, selectedGodown, groupBy]
  )

  const { data, dailyTrend, summary, isLoading } = useDailyReport(filters)

  // Reset Filters
  const handleResetFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    setDateTo(format(new Date(), 'yyyy-MM-dd'))
    setSelectedParties([])
    setSelectedQualities([])
    setSelectedGodown('all')
    setGroupBy('none')
  }

  // Define Columns
  const columns: ReportColumn<InventoryTransaction>[] = [
    {
      key: 'transaction_date',
      header: 'Date',
      sortable: true,
      render: (row) => format(new Date(row.transaction_date), 'dd/MM/yyyy'),
    },
    {
      key: 'party_id',
      header: 'Party',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block truncate max-w-[140px]">
            {row.parties?.party_name || '—'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {row.parties?.party_code}
          </span>
        </div>
      ),
    },
    {
      key: 'quality_id',
      header: 'Quality',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {row.qualities?.quality_name || '—'}
        </span>
      ),
    },
    {
      key: 'bill_number',
      header: 'Bill No',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-slate-600 font-medium">
          {row.bill_number || '—'}
        </span>
      ),
    },
    {
      key: 'vehicle_in_id',
      header: 'Lorry In',
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-bold border border-blue-100">
          {row.vehicles_in?.lorry_number || row.vehicle_in_id || '—'}
        </span>
      ),
    },
    {
      key: 'inward_weight',
      header: 'Inward MT',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700">
          {(row.inward_weight || 0).toFixed(3)}
        </span>
      ),
    },
    {
      key: 'godown_weight',
      header: 'Godown MT',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-slate-700">
          {(row.godown_weight || 0).toFixed(3)}
        </span>
      ),
    },
    {
      key: 'weight_variance',
      header: 'Variance',
      align: 'right',
      sortable: true,
      render: (row) => {
        const v = row.weight_variance || 0
        return (
          <span
            className={cn(
              'font-mono font-bold text-[11px]',
              v === 0 ? 'text-emerald-600' : v > 0 ? 'text-amber-600' : 'text-rose-600'
            )}
          >
            {v > 0 ? `+${v.toFixed(3)}` : v.toFixed(3)}
          </span>
        )
      },
    },
    {
      key: 'vehicle_out_id',
      header: 'Lorry Out',
      render: (row) => (
        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-[11px] font-bold border border-amber-100">
          {row.vehicles_out?.lorry_number || row.vehicle_out_id || '—'}
        </span>
      ),
    },
    {
      key: 'outward_weight',
      header: 'Outward MT',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-amber-700">
          {(row.outward_weight || 0).toFixed(3)}
        </span>
      ),
    },
    {
      key: 'net_stock',
      header: 'Net Stock',
      align: 'right',
      sortable: true,
      render: (row) => {
        const n = row.net_stock || 0
        return (
          <span
            className={cn(
              'font-mono font-bold',
              n >= 0 ? 'text-blue-600' : 'text-rose-600'
            )}
          >
            {n.toFixed(3)}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <span
          className={cn(
            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
            row.status === 'completed'
              ? 'bg-emerald-100 text-emerald-800'
              : row.status === 'draft'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800'
          )}
        >
          {row.status}
        </span>
      ),
    },
  ]

  // Totals Row definition
  const totalsCells: ReportTotalsCell[] = [
    { key: 'label', content: 'TOTALS', colSpan: 5 },
    {
      key: 'inward',
      align: 'right',
      content: (
        <span className="font-mono text-emerald-300 font-bold">
          {summary.totalInward.toFixed(3)} MT
        </span>
      ),
    },
    {
      key: 'godown',
      align: 'right',
      content: (
        <span className="font-mono text-slate-300 font-bold">
          {(
            data.reduce((sum, t) => sum + (t.godown_weight || 0), 0)
          ).toFixed(3)} MT
        </span>
      ),
    },
    {
      key: 'variance',
      align: 'right',
      content: (
        <span
          className={cn(
            'font-mono font-bold',
            summary.totalVariance === 0
              ? 'text-slate-300'
              : summary.totalVariance > 0
              ? 'text-amber-300'
              : 'text-rose-300'
          )}
        >
          {summary.totalVariance > 0
            ? `+${summary.totalVariance.toFixed(3)}`
            : summary.totalVariance.toFixed(3)}{' '}
          MT
        </span>
      ),
    },
    { key: 'empty_lorry', content: '' },
    {
      key: 'outward',
      align: 'right',
      content: (
        <span className="font-mono text-amber-300 font-bold">
          {summary.totalOutward.toFixed(3)} MT
        </span>
      ),
    },
    {
      key: 'net',
      align: 'right',
      content: (
        <span
          className={cn(
            'font-mono font-bold',
            summary.netPosition >= 0 ? 'text-blue-300' : 'text-rose-300'
          )}
        >
          {summary.netPosition.toFixed(3)} MT
        </span>
      ),
    },
    { key: 'status_empty', content: '' },
  ]

  // Filter content JSX
  const filterContent = (
    <div className="space-y-4">
      {/* Row 1: Date Range & Quick Presets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Date From
          </label>
          <input
            type="date"
            max={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Date To
          </label>
          <input
            type="date"
            max={new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          />
        </div>

        {/* Quick Range Shortcut Pills */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Quick Date Presets
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQuickRange('today')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('yesterday')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition cursor-pointer"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('this_week')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition cursor-pointer"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setQuickRange('this_month')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-700 transition cursor-pointer"
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Party, Quality, Godown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Party Multi-Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Parties ({selectedParties.length === 0 ? 'All' : selectedParties.length})
          </label>
          <select
            multiple
            value={selectedParties}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions, (option) => option.value)
              setSelectedParties(opts)
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white h-24"
          >
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.party_name} ({p.party_code})
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Hold Ctrl/Cmd to select multiple
          </span>
        </div>

        {/* Quality Multi-Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Qualities ({selectedQualities.length === 0 ? 'All' : selectedQualities.length})
          </label>
          <select
            multiple
            value={selectedQualities}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions, (option) => option.value)
              setSelectedQualities(opts)
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white h-24"
          >
            {qualities.map((q) => (
              <option key={q.id} value={q.id}>
                {q.quality_name} ({q.category || 'Scrap'})
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Hold Ctrl/Cmd to select multiple
          </span>
        </div>

        {/* Godown Single Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Godown Location
          </label>
          <select
            value={selectedGodown}
            onChange={(e) => setSelectedGodown(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="all">All Godowns / Bays</option>
            {godowns.map((g) => (
              <option key={g.id} value={g.id}>
                {g.godown_name} ({g.godown_code})
              </option>
            ))}
          </select>

          {/* Group By Radio Buttons */}
          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Group Records By
            </label>
            <div className="flex items-center gap-3 text-xs">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="groupByDaily"
                  value="none"
                  checked={groupBy === 'none'}
                  onChange={() => setGroupBy('none')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>None (Flat List)</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="groupByDaily"
                  value="quality"
                  checked={groupBy === 'quality'}
                  onChange={() => setGroupBy('quality')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>By Quality</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="radio"
                  name="groupByDaily"
                  value="godown"
                  checked={groupBy === 'godown'}
                  onChange={() => setGroupBy('godown')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span>By Godown</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ReportLayout
      title="Daily Weighbridge Summary Report"
      subtitle="Consolidated day-wise weighbridge weighments, godown intake, scale variance, and outward dispatches."
      filterContent={filterContent}
      activeFiltersCount={activeFiltersCount}
      onResetFilters={handleResetFilters}
    >
      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 no-print select-none">
        <button
          type="button"
          onClick={() => setActiveReportTab('weighbridge')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeReportTab === 'weighbridge'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          )}
        >
          Daily Weighbridge Ledger
        </button>
        <button
          type="button"
          onClick={() => setActiveReportTab('sauda')}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2',
            activeReportTab === 'sauda'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          )}
        >
          <span>Item-Wise Sauda Rate Summary</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">
            Commercial
          </span>
        </button>
      </div>

      {activeReportTab === 'sauda' && (
        <ItemWiseSaudaTable showToolbar={true} />
      )}

      {activeReportTab === 'weighbridge' && (
        <>
      {/* Visual Chart Card */}
      {dailyTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Daily Weighment Trend (Inward vs Outward MT)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {dailyTrend.length} days plotted
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dailyTrend}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="formattedDate"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit=" MT"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(3)} MT`]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                  formatter={(value) => (value === 'totalInward' ? 'Inward Weight' : 'Outward Weight')}
                />
                <Bar dataKey="totalInward" fill="#2563eb" radius={[4, 4, 0, 0]} name="totalInward" />
                <Bar dataKey="totalOutward" fill="#f59e0b" radius={[4, 4, 0, 0]} name="totalOutward" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Toolbar with Metrics & Export Actions */}
      <ReportToolbar
        recordCount={summary.recordCount}
        totalInward={summary.totalInward}
        totalOutward={summary.totalOutward}
        totalVariance={summary.totalVariance}
        netStock={summary.netPosition}
        onExportExcel={() => exportToExcel(getDailyReportExcelConfig(data, filters, summary))}
        onExportPDF={() => exportToPDF(getDailyReportPDFConfig(data, filters, summary))}
        onExportCSV={() => exportToCSV(prepareTransactionExportRows(data), 'Daily_Weighbridge_Report')}
      />

      {/* Data Table */}
      <ReportTable<InventoryTransaction>
        columns={columns}
        data={data}
        isLoading={isLoading}
        totals={totalsCells}
        emptyMessage="No weighbridge transactions match your specified date range or filter criteria."
      />
        </>
      )}
    </ReportLayout>
  )
}

export default DailyReport
