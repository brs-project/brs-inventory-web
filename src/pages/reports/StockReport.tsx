import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Boxes,
  PieChart as PieChartIcon,
  Warehouse,
} from 'lucide-react'
import { ReportLayout } from '@components/reports/ReportLayout'
import { ReportToolbar } from '@components/reports/ReportToolbar'
import {
  ReportTable,
  type ReportColumn,
  type ReportTotalsCell,
} from '@components/reports/ReportTable'
import { useQualities, useGodowns } from '@hooks/useMasterData'
import {
  useStockReport,
  type StockReportFilters,
  type QualityStockRow,
} from '@hooks/useReports'
import { exportToExcel } from '@lib/exportExcel'
import { exportToPDF } from '@lib/exportPDF'
import { exportToCSV } from '@lib/exportCSV'
import {
  getStockReportExcelConfig,
  getStockReportPDFConfig,
  prepareStockExportRows,
} from '@lib/reportConfigs'
import { cn } from '@lib/utils'

export function StockReport() {
  const { qualities } = useQualities()
  const { godowns } = useGodowns()

  // State
  const [asOfDate, setAsOfDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedQualities, setSelectedQualities] = useState<string[]>([])
  const [selectedGodowns, setSelectedGodowns] = useState<string[]>([])
  const [showZeroStock, setShowZeroStock] = useState<boolean>(false)

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedQualities.length > 0) count++
    if (selectedGodowns.length > 0) count++
    if (showZeroStock) count++
    return count
  }, [selectedQualities, selectedGodowns, showZeroStock])

  const filters: StockReportFilters = useMemo(
    () => ({
      asOfDate,
      qualityIds: selectedQualities.length > 0 ? selectedQualities : undefined,
      godownIds: selectedGodowns.length > 0 ? selectedGodowns : undefined,
      showZeroStock,
    }),
    [asOfDate, selectedQualities, selectedGodowns, showZeroStock]
  )

  const { data, summary, donutData, isLoading } = useStockReport(filters)

  const handleResetFilters = () => {
    setAsOfDate(format(new Date(), 'yyyy-MM-dd'))
    setSelectedQualities([])
    setSelectedGodowns([])
    setShowZeroStock(false)
  }

  // Stock level color helper
  const getStockBadgeClass = (stock: number) => {
    if (stock >= 1000) return 'bg-emerald-50 text-emerald-800 border-emerald-300'
    if (stock >= 500) return 'bg-blue-50 text-blue-800 border-blue-300'
    if (stock >= 100) return 'bg-amber-50 text-amber-800 border-amber-300'
    return 'bg-rose-50 text-rose-800 border-rose-300'
  }

  const getStockBarColor = (stock: number) => {
    if (stock >= 1000) return 'bg-emerald-500'
    if (stock >= 500) return 'bg-blue-500'
    if (stock >= 100) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  // Table Columns
  const columns: ReportColumn<QualityStockRow>[] = [
    {
      key: 'quality_name',
      header: 'Quality Grade',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.quality.quality_name}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            {row.quality.quality_code} • {row.quality.unit_of_measure}
          </span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {row.quality.category || 'Scrap'}
        </span>
      ),
    },
    {
      key: 'totalInward',
      header: 'Total Inward MT',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700">
          {row.totalInward.toFixed(3)}
        </span>
      ),
    },
    {
      key: 'totalOutward',
      header: 'Total Outward MT',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-amber-700">
          {row.totalOutward.toFixed(3)}
        </span>
      ),
    },
    {
      key: 'currentStock',
      header: 'Current Stock (MT)',
      align: 'right',
      sortable: true,
      render: (row) => (
        <div className="flex flex-col items-end">
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full border text-xs font-mono font-extrabold',
              getStockBadgeClass(row.currentStock)
            )}
          >
            {row.currentStock.toFixed(3)} MT
          </span>
          {/* Progress bar of stock % */}
          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden border border-slate-200">
            <div
              className={cn('h-full rounded-full', getStockBarColor(row.currentStock))}
              style={{ width: `${Math.min(100, row.stockPercentage)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'stockPercentage',
      header: 'Stock %',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-slate-700 text-xs">
          {row.stockPercentage}%
        </span>
      ),
    },
  ]

  // Totals Row
  const totalsCells: ReportTotalsCell[] = [
    { key: 'label', content: 'GRAND TOTAL', colSpan: 2 },
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
      key: 'outward',
      align: 'right',
      content: (
        <span className="font-mono text-amber-300 font-bold">
          {summary.totalOutward.toFixed(3)} MT
        </span>
      ),
    },
    {
      key: 'stock',
      align: 'right',
      content: (
        <span className="font-mono text-white font-extrabold text-sm">
          {summary.currentStock.toFixed(3)} MT
        </span>
      ),
    },
    {
      key: 'pct',
      align: 'right',
      content: <span className="font-mono text-slate-300 font-bold">100%</span>,
    },
  ]

  // Expandable sub-row showing Godown break-down
  const renderGodownSubRow = (row: QualityStockRow) => {
    if (!row.godownBreakdowns || row.godownBreakdowns.length === 0) {
      return (
        <div className="text-xs text-slate-400 py-1 italic">
          No active godown bays assigned for this quality.
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Warehouse className="h-3.5 w-3.5 text-blue-600" />
          <span>
            Godown Bay Stock Distribution for <strong className="text-slate-900">{row.quality.quality_name}</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Godown Name</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2 text-right">Inward MT</th>
                <th className="px-3 py-2 text-right">Outward MT</th>
                <th className="px-3 py-2 text-right">Bay Stock MT</th>
                <th className="px-3 py-2 text-right">% of Quality</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {row.godownBreakdowns.map((gb) => (
                <tr key={gb.godown.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {gb.godown.godown_name}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-500 text-[11px]">
                    {gb.godown.godown_code}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-700">
                    {gb.totalInward.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-amber-700">
                    {gb.totalOutward.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[11px] font-mono font-bold',
                        gb.currentStock > 0
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-slate-400'
                      )}
                    >
                      {gb.currentStock.toFixed(3)} MT
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-600">
                    {gb.stockPercentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Filter content JSX
  const filterContent = (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
      {/* As of Date */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          As Of Date
        </label>
        <input
          type="date"
          value={asOfDate}
          onChange={(e) => setAsOfDate(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
        />
        <span className="text-[10px] text-slate-400 mt-1 block">
          Calculates cumulative stock up to midnight
        </span>
      </div>

      {/* Qualities Multi-Select */}
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
      </div>

      {/* Godowns Multi-Select */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Godowns ({selectedGodowns.length === 0 ? 'All' : selectedGodowns.length})
        </label>
        <select
          multiple
          value={selectedGodowns}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions, (option) => option.value)
            setSelectedGodowns(opts)
          }}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white h-24"
        >
          {godowns.map((g) => (
            <option key={g.id} value={g.id}>
              {g.godown_name} ({g.godown_code})
            </option>
          ))}
        </select>
      </div>

      {/* Zero Stock Toggle & Legend */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Inventory Options
        </label>
        <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition">
          <input
            type="checkbox"
            checked={showZeroStock}
            onChange={(e) => setShowZeroStock(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
          />
          <span className="text-xs font-bold text-slate-800">
            Show Zero Stock Items
          </span>
        </label>

        {/* Legend */}
        <div className="text-[10px] space-y-1 text-slate-500 pt-1">
          <span className="font-bold text-slate-700 block">Stock Level Legend:</span>
          <div className="flex flex-wrap gap-1">
            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              &gt;1000 MT
            </span>
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
              500-1000 MT
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
              100-500 MT
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
              &lt;100 MT
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ReportLayout
      title="Godown Stock & Inventory Balance Report"
      subtitle="Real-time physical stock distribution, quality grade breakdown, and bay balance positions."
      filterContent={filterContent}
      activeFiltersCount={activeFiltersCount}
      onResetFilters={handleResetFilters}
    >
      {/* Visual Distribution Section (Donut Chart + Summary) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Left 2 cols: Stock KPI Overview Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Boxes className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Warehouse Stock Position as of {format(new Date(asOfDate), 'dd MMMM yyyy')}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Consolidated net holding across all registered warehouse bays. All weights are
              computed strictly from authenticated weighbridge slips and dispatch logs.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Inward
              </span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-emerald-700">
                {summary.totalInward.toFixed(3)} <span className="text-xs font-normal">MT</span>
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Total Outward
              </span>
              <span className="text-base sm:text-lg font-mono font-extrabold text-amber-700">
                {summary.totalOutward.toFixed(3)} <span className="text-xs font-normal">MT</span>
              </span>
            </div>
            <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100">
              <span className="text-[11px] font-semibold text-blue-700 block">
                Net Physical Stock
              </span>
              <span className="text-base sm:text-lg font-mono font-black text-blue-900">
                {summary.currentStock.toFixed(3)} <span className="text-xs font-normal">MT</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right col: Quality Distribution Donut Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PieChartIcon className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold text-slate-900">Stock by Quality Grade</h4>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">
              {donutData.length} Grades
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                  formatter={(val: any) => [`${Number(val).toFixed(3)} MT`, 'Stock']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Toolbar with Metrics & Export Actions */}
      <ReportToolbar
        recordCount={summary.totalQualities}
        totalInward={summary.totalInward}
        totalOutward={summary.totalOutward}
        netStock={summary.currentStock}
        onExportExcel={() => exportToExcel(getStockReportExcelConfig(data, filters, summary))}
        onExportPDF={() => exportToPDF(getStockReportPDFConfig(data, filters, summary))}
        onExportCSV={() => exportToCSV(prepareStockExportRows(data), 'Godown_Stock_Report')}
      />

      {/* Data Table */}
      <ReportTable<QualityStockRow>
        columns={columns}
        data={data}
        isLoading={isLoading}
        totals={totalsCells}
        renderSubRow={renderGodownSubRow}
        emptyMessage="No stock records found for the selected date or quality parameters."
      />
    </ReportLayout>
  )
}

export default StockReport
