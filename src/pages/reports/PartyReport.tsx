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
  BarChart3,
  Award,
  MapPin,
} from 'lucide-react'
import { ReportLayout } from '@components/reports/ReportLayout'
import { ReportToolbar } from '@components/reports/ReportToolbar'
import {
  ReportTable,
  type ReportColumn,
  type ReportTotalsCell,
} from '@components/reports/ReportTable'
import { useParties, useQualities } from '@hooks/useMasterData'
import {
  usePartyReport,
  type PartyReportFilters,
  type PartyReportRow,
} from '@hooks/useReports'
import { exportToExcel } from '@lib/exportExcel'
import { exportToPDF } from '@lib/exportPDF'
import { exportToCSV } from '@lib/exportCSV'
import {
  getPartyReportExcelConfig,
  getPartyReportPDFConfig,
  preparePartyExportRows,
} from '@lib/reportConfigs'
import { cn } from '@lib/utils'

export function PartyReport() {
  const { parties } = useParties()
  const { qualities } = useQualities()

  // Filters State
  const [dateFrom, setDateFrom] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  )
  const [dateTo, setDateTo] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedParties, setSelectedParties] = useState<string[]>([])
  const [selectedQualities, setSelectedQualities] = useState<string[]>([])
  const [groupBy, setGroupBy] = useState<'party' | 'party_quality' | 'party_date'>('party')

  // Quick range buttons
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
    if (selectedParties.length > 0) count++
    if (selectedQualities.length > 0) count++
    if (groupBy !== 'party') count++
    return count
  }, [selectedParties, selectedQualities, groupBy])

  const filters: PartyReportFilters = useMemo(
    () => ({
      dateFrom,
      dateTo,
      partyIds: selectedParties.length > 0 ? selectedParties : undefined,
      qualityIds: selectedQualities.length > 0 ? selectedQualities : undefined,
      groupBy,
    }),
    [dateFrom, dateTo, selectedParties, selectedQualities, groupBy]
  )

  const { data, summary, chartData, isLoading } = usePartyReport(filters)

  const handleResetFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
    setDateTo(format(new Date(), 'yyyy-MM-dd'))
    setSelectedParties([])
    setSelectedQualities([])
    setGroupBy('party')
  }

  // Table Columns
  const columns: ReportColumn<PartyReportRow>[] = [
    {
      key: 'party_name',
      header: 'Party / Client',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">
            {row.party.party_name}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
            <span>{row.party.party_code}</span>
            {row.party.city && (
              <span className="flex items-center gap-0.5 text-slate-500 font-sans">
                <MapPin className="h-2.5 w-2.5" />
                {row.party.city}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'transactionCount',
      header: 'Transactions',
      align: 'center',
      sortable: true,
      render: (row) => (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs">
          {row.transactionCount}
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
      key: 'netStock',
      header: 'Net Consignment MT',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span
          className={cn(
            'font-mono font-bold',
            row.netStock >= 0 ? 'text-blue-600' : 'text-rose-600'
          )}
        >
          {row.netStock.toFixed(3)}
        </span>
      ),
    },
    {
      key: 'avgWeight',
      header: 'Avg Weight / Slip',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-slate-600 text-[11px]">
          {row.avgWeight.toFixed(3)} MT
        </span>
      ),
    },
  ]

  // Totals Row
  const totalsCells: ReportTotalsCell[] = [
    { key: 'label', content: `TOTALS (${summary.totalParties} PARTIES)`, colSpan: 1 },
    {
      key: 'txns',
      align: 'center',
      content: (
        <span className="font-mono text-blue-300 font-bold">
          {summary.totalTransactions} Slips
        </span>
      ),
    },
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
      key: 'net',
      align: 'right',
      content: (
        <span className="font-mono text-white font-extrabold">
          {summary.netStock.toFixed(3)} MT
        </span>
      ),
    },
    {
      key: 'avg',
      align: 'right',
      content: (
        <span className="font-mono text-slate-300 font-bold text-[11px]">
          {summary.avgWeight.toFixed(3)} MT
        </span>
      ),
    },
  ]

  // Expandable row: Quality-wise breakdown for party
  const renderQualitySubRow = (row: PartyReportRow) => {
    if (!row.qualityBreakdowns || row.qualityBreakdowns.length === 0) {
      return (
        <div className="text-xs text-slate-400 py-1 italic">
          No grade breakdown available for this party.
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Award className="h-3.5 w-3.5 text-blue-600" />
          <span>
            Commodity Grade Breakdown for <strong className="text-slate-900">{row.party.party_name}</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Quality Grade</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-center">Slips</th>
                <th className="px-3 py-2 text-right">Inward MT</th>
                <th className="px-3 py-2 text-right">Outward MT</th>
                <th className="px-3 py-2 text-right">Net Position MT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {row.qualityBreakdowns.map((qb) => (
                <tr key={qb.quality.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {qb.quality.quality_name}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold border border-slate-200">
                      {qb.quality.category || 'Scrap'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center font-mono font-bold text-slate-700">
                    {qb.transactionCount}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-700 font-semibold">
                    {qb.totalInward.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-amber-700 font-semibold">
                    {qb.totalOutward.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span
                      className={cn(
                        'font-mono font-bold',
                        qb.netStock >= 0 ? 'text-blue-600' : 'text-rose-600'
                      )}
                    >
                      {qb.netStock.toFixed(3)} MT
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

      {/* Row 2: Parties, Qualities, Group By */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        </div>

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

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Aggregation Level
          </label>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="groupByParty"
                value="party"
                checked={groupBy === 'party'}
                onChange={() => setGroupBy('party')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>By Party (Consolidated Ledger)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="groupByParty"
                value="party_quality"
                checked={groupBy === 'party_quality'}
                onChange={() => setGroupBy('party_quality')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>By Party + Quality</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="radio"
                name="groupByParty"
                value="party_date"
                checked={groupBy === 'party_date'}
                onChange={() => setGroupBy('party_date')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>By Party + Date</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ReportLayout
      title="Party / Supplier Ledger Report"
      subtitle="Party-wise consignment tonnage, slip counts, inward/outward reconciliation, and average consignment weights."
      filterContent={filterContent}
      activeFiltersCount={activeFiltersCount}
      onResetFilters={handleResetFilters}
    >
      {/* Horizontal Bar Chart for Top Parties */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Top Parties by Inward &amp; Outward Tonnage (MT)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Top {chartData.length} suppliers
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 10, right: 20, left: 50, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  unit=" MT"
                />
                <YAxis
                  dataKey="partyName"
                  type="category"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  width={120}
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
                <Bar dataKey="totalInward" fill="#2563eb" radius={[0, 4, 4, 0]} name="totalInward" />
                <Bar dataKey="totalOutward" fill="#f59e0b" radius={[0, 4, 4, 0]} name="totalOutward" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Toolbar with Metrics & Export Actions */}
      <ReportToolbar
        recordCount={summary.totalParties}
        totalInward={summary.totalInward}
        totalOutward={summary.totalOutward}
        netStock={summary.netStock}
        customStats={[
          { label: 'Total Slips', value: `${summary.totalTransactions}` },
          { label: 'Avg Slip Weight', value: `${summary.avgWeight.toFixed(3)} MT` },
        ]}
        onExportExcel={() => exportToExcel(getPartyReportExcelConfig(data, filters, summary))}
        onExportPDF={() => exportToPDF(getPartyReportPDFConfig(data, filters, summary))}
        onExportCSV={() => exportToCSV(preparePartyExportRows(data), 'Party_Ledger_Report')}
      />

      {/* Data Table */}
      <ReportTable<PartyReportRow>
        columns={columns}
        data={data}
        isLoading={isLoading}
        totals={totalsCells}
        renderSubRow={renderQualitySubRow}
        emptyMessage="No party weighments match the selected date or party criteria."
      />
    </ReportLayout>
  )
}

export default PartyReport
