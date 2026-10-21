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
  Truck,
  TrendingUp,
} from 'lucide-react'
import { ReportLayout } from '@components/reports/ReportLayout'
import { ReportToolbar } from '@components/reports/ReportToolbar'
import {
  ReportTable,
  type ReportColumn,
  type ReportTotalsCell,
} from '@components/reports/ReportTable'
import { useVehicles } from '@hooks/useMasterData'
import {
  useVehicleReport,
  type VehicleReportFilters,
  type VehicleReportRow,
} from '@hooks/useReports'
import { exportToExcel } from '@lib/exportExcel'
import { exportToPDF } from '@lib/exportPDF'
import { exportToCSV } from '@lib/exportCSV'
import {
  getVehicleReportExcelConfig,
  getVehicleReportPDFConfig,
  prepareVehicleExportRows,
} from '@lib/reportConfigs'
import { cn } from '@lib/utils'

export function VehicleReport() {
  const { vehicles } = useVehicles()

  // Filters State
  const [dateFrom, setDateFrom] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedLorries, setSelectedLorries] = useState<string[]>([])
  const [movementType, setMovementType] = useState<'all' | 'inward_only' | 'outward_only'>('all')
  const [vehicleType, setVehicleType] = useState<'all' | 'Heavy' | 'Medium' | 'Light'>('all')

  // Quick range helpers
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

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (selectedLorries.length > 0) count++
    if (movementType !== 'all') count++
    if (vehicleType !== 'all') count++
    return count
  }, [selectedLorries, movementType, vehicleType])

  const filters: VehicleReportFilters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      lorryNumbers: selectedLorries.length > 0 ? selectedLorries : undefined,
      movementType,
      vehicleType,
    }),
    [dateFrom, dateTo, selectedLorries, movementType, vehicleType]
  )

  const { data, summary, chartData, isLoading } = useVehicleReport(filters)

  const handleResetFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    setDateTo(format(new Date(), 'yyyy-MM-dd'))
    setSelectedLorries([])
    setMovementType('all')
    setVehicleType('all')
  }

  // Columns definition
  const columns: ReportColumn<VehicleReportRow>[] = [
    {
      key: 'lorryNumber',
      header: 'Lorry Number',
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono text-xs font-bold border border-blue-200 inline-block shadow-2xs">
          {row.lorryNumber}
        </span>
      ),
    },
    {
      key: 'ownerName',
      header: 'Owner / Transporter',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-semibold text-slate-900 block truncate max-w-[160px]">
          {row.ownerName}
        </span>
      ),
    },
    {
      key: 'vehicleType',
      header: 'Fleet Type',
      align: 'center',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {row.vehicleType}
        </span>
      ),
    },
    {
      key: 'inwardTrips',
      header: 'Inward Trips',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700 text-xs">
          {row.inwardTrips}
        </span>
      ),
    },
    {
      key: 'totalInwardMT',
      header: 'Total Inward MT',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-emerald-700">
          {row.totalInwardMT.toFixed(3)}
        </span>
      ),
    },
    {
      key: 'outwardTrips',
      header: 'Outward Trips',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-amber-700 text-xs">
          {row.outwardTrips}
        </span>
      ),
    },
    {
      key: 'totalOutwardMT',
      header: 'Total Outward MT',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono font-bold text-amber-700">
          {row.totalOutwardMT.toFixed(3)}
        </span>
      ),
    },
    {
      key: 'totalTrips',
      header: 'Total Trips',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono font-bold text-xs">
          {row.totalTrips}
        </span>
      ),
    },
  ]

  // Totals Row
  const totalsCells: ReportTotalsCell[] = [
    { key: 'label', content: `TOTALS (${summary.totalVehicles} VEHICLES)`, colSpan: 3 },
    {
      key: 'in_trips',
      align: 'center',
      content: (
        <span className="font-mono text-emerald-300 font-bold">
          {summary.inwardTrips}
        </span>
      ),
    },
    {
      key: 'in_mt',
      align: 'right',
      content: (
        <span className="font-mono text-emerald-300 font-bold">
          {summary.totalInwardMT.toFixed(3)} MT
        </span>
      ),
    },
    {
      key: 'out_trips',
      align: 'center',
      content: (
        <span className="font-mono text-amber-300 font-bold">
          {summary.outwardTrips}
        </span>
      ),
    },
    {
      key: 'out_mt',
      align: 'right',
      content: (
        <span className="font-mono text-amber-300 font-bold">
          {summary.totalOutwardMT.toFixed(3)} MT
        </span>
      ),
    },
    {
      key: 'total_trips',
      align: 'center',
      content: (
        <span className="font-mono text-white font-extrabold text-xs">
          {summary.totalTrips} Trips
        </span>
      ),
    },
  ]

  // Expandable sub-row showing transactions for vehicle
  const renderVehicleSubRow = (row: VehicleReportRow) => {
    if (!row.transactions || row.transactions.length === 0) {
      return (
        <div className="text-xs text-slate-400 py-1 italic">
          No detailed weighbridge entries found for this lorry.
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Truck className="h-3.5 w-3.5 text-blue-600" />
          <span>
            Weighbridge Trip Logs for Lorry <strong className="font-mono text-blue-700">{row.lorryNumber}</strong> ({row.transactions.length} trips)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Bill No</th>
                <th className="px-3 py-2">Party</th>
                <th className="px-3 py-2">Quality</th>
                <th className="px-3 py-2">Godown Bay</th>
                <th className="px-3 py-2 text-right">Inward MT</th>
                <th className="px-3 py-2 text-right">Outward MT</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {row.transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2 text-slate-600">
                    {format(new Date(t.transaction_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-800">
                    {t.bill_number}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {t.parties?.party_name || '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {t.qualities?.quality_name || '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {t.godowns?.godown_name || '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-700 font-semibold">
                    {(t.inward_weight || 0).toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-amber-700 font-semibold">
                    {(t.outward_weight || 0).toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                        t.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {t.status}
                    </span>
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
    <div className="space-y-4">
      {/* Row 1: Dates & Presets */}
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

      {/* Row 2: Lorry numbers, Movement Type, Vehicle Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Lorry Number Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Lorries ({selectedLorries.length === 0 ? 'All Fleet' : selectedLorries.length})
          </label>
          <select
            multiple
            value={selectedLorries}
            onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions, (option) => option.value)
              setSelectedLorries(opts)
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white h-24"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.lorry_number}>
                {v.lorry_number} — {v.owner_name}
              </option>
            ))}
          </select>
        </div>

        {/* Movement Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Trip Movement Type
          </label>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="movementType"
                value="all"
                checked={movementType === 'all'}
                onChange={() => setMovementType('all')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Both (Inward &amp; Outward Dispatches)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="movementType"
                value="inward_only"
                checked={movementType === 'inward_only'}
                onChange={() => setMovementType('inward_only')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Inward Supply Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="movementType"
                value="outward_only"
                checked={movementType === 'outward_only'}
                onChange={() => setMovementType('outward_only')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Outward Delivery Only</span>
            </label>
          </div>
        </div>

        {/* Vehicle Fleet Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Vehicle Fleet Type
          </label>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="vehicleType"
                value="all"
                checked={vehicleType === 'all'}
                onChange={() => setVehicleType('all')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>All Types</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="vehicleType"
                value="Heavy"
                checked={vehicleType === 'Heavy'}
                onChange={() => setVehicleType('Heavy')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Heavy Commercial (10+ Wheeler)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="vehicleType"
                value="Medium"
                checked={vehicleType === 'Medium'}
                onChange={() => setVehicleType('Medium')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>Medium / 6 Wheeler</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ReportLayout
      title="Vehicle &amp; Fleet Movement Report"
      subtitle="Comprehensive lorry turnaround times, trip count summaries, and weighbridge haulage volume."
      filterContent={filterContent}
      activeFiltersCount={activeFiltersCount}
      onResetFilters={handleResetFilters}
    >
      {/* Top 10 Vehicles by Volume Bar Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Top Fleet Vehicles by Total Haulage Volume (MT)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Top {chartData.length} Lorries
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="lorryNumber"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
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
                    fontSize: '11px',
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
        recordCount={summary.totalVehicles}
        totalInward={summary.totalInwardMT}
        totalOutward={summary.totalOutwardMT}
        customStats={[
          { label: 'Inward Trips', value: `${summary.inwardTrips}`, color: 'text-emerald-400' },
          { label: 'Outward Trips', value: `${summary.outwardTrips}`, color: 'text-amber-400' },
          { label: 'Total Trips', value: `${summary.totalTrips}`, color: 'text-white' },
        ]}
        onExportExcel={() => exportToExcel(getVehicleReportExcelConfig(data, filters, summary))}
        onExportPDF={() => exportToPDF(getVehicleReportPDFConfig(data, filters, summary))}
        onExportCSV={() => exportToCSV(prepareVehicleExportRows(data), 'Vehicle_Movement_Report')}
      />

      {/* Data Table */}
      <ReportTable<VehicleReportRow>
        columns={columns}
        data={data}
        isLoading={isLoading}
        totals={totalsCells}
        renderSubRow={renderVehicleSubRow}
        emptyMessage="No vehicle weighbridge trips recorded for the selected parameters."
      />
    </ReportLayout>
  )
}

export default VehicleReport
