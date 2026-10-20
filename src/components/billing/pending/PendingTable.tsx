import { useState, useMemo } from 'react'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Eye,
  Edit2,
  CreditCard,
  Trash2,
} from 'lucide-react'
import { PendingTableRow } from './PendingTableRow'
import { PendingTotalsRow } from './PendingTotalsRow'
import { PendingEmptyState } from './PendingEmptyState'
import { formatCurrency, formatRate, formatMT } from '@lib/billCalculations'
import { cn } from '@lib/utils'
import type { BillEntry } from '@types'

export interface PendingTableProps {
  data: BillEntry[]
  selectedIds: string[]
  onToggleSelectAll: () => void
  onToggleSelectRow: (id: string) => void
  onView: (entry: BillEntry) => void
  onEdit: (entry: BillEntry) => void
  onDelete: (entry: BillEntry) => void
  onMarkAsPaid: (entry: BillEntry) => void
  isFiltered: boolean
  onResetFilters?: () => void
  onViewAllBills?: () => void
  onAddBill?: () => void
}

type SortField =
  | 'age'
  | 'party'
  | 'quality'
  | 'lorry'
  | 'quantity'
  | 'bill_rate'
  | 'actual_rate'
  | 'rate_difference'
  | 'rtgs_amount'

type SortDirection = 'asc' | 'desc'

export function PendingTable({
  data,
  selectedIds,
  onToggleSelectAll,
  onToggleSelectRow,
  onView,
  onEdit,
  onDelete,
  onMarkAsPaid,
  isFiltered,
  onResetFilters,
  onViewAllBills,
  onAddBill,
}: PendingTableProps) {
  const [sortField, setSortField] = useState<SortField>('age')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(25)

  // Calculate Days Aging
  const getAgingDays = (billDate: string): number => {
    const diff = new Date().getTime() - new Date(billDate).getTime()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  }

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Sorted Data
  const sortedData = useMemo(() => {
    const list = [...data]
    return list.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'age':
          comparison = getAgingDays(a.bill_date) - getAgingDays(b.bill_date)
          break
        case 'party':
          comparison = (a.party_code || a.parties?.party_code || '').localeCompare(
            b.party_code || b.parties?.party_code || ''
          )
          break
        case 'quality':
          comparison = (a.qualities?.quality_name || '').localeCompare(
            b.qualities?.quality_name || ''
          )
          break
        case 'lorry':
          comparison = a.lorry_number.localeCompare(b.lorry_number)
          break
        case 'quantity':
          comparison = a.quantity_mt - b.quantity_mt
          break
        case 'bill_rate':
          comparison = a.bill_rate - b.bill_rate
          break
        case 'actual_rate':
          comparison = a.actual_rate - b.actual_rate
          break
        case 'rate_difference':
          comparison = a.rate_difference - b.rate_difference
          break
        case 'rtgs_amount':
          comparison = a.rtgs_amount - b.rtgs_amount
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortField, sortDirection])

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const currentPage = Math.min(pageIndex, totalPages - 1)
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  // Selection Status
  const isAllSelected = data.length > 0 && selectedIds.length === data.length
  const isSomeSelected =
    selectedIds.length > 0 && selectedIds.length < data.length

  // Overall Totals for full filtered data
  const totals = useMemo(() => {
    let totalQty = 0
    let totalRtgs = 0
    let rateDiffSum = 0

    for (const item of data) {
      totalQty += item.quantity_mt || 0
      totalRtgs += item.rtgs_amount || 0
      rateDiffSum += item.rate_difference || 0
    }

    const avgRateDiff = data.length > 0 ? rateDiffSum / data.length : 0

    return {
      totalQuantityMT: totalQty,
      avgRateDiff,
      netRtgsAmount: totalRtgs,
    }
  }, [data])

  // Sort Icon Renderer
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 ml-1 inline" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-zinc-900 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 text-zinc-900 ml-1 inline" />
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <PendingEmptyState
          isFiltered={isFiltered}
          onResetFilters={onResetFilters}
          onViewAllBills={onViewAllBills}
          onAddBill={onAddBill}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
      {/* 1. DESKTOP & TABLET TABLE (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] select-none text-[#4B5563]">
              {/* Checkbox */}
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  aria-label="Select all bills"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected
                  }}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-[#D1D5DB] text-zinc-900 focus:ring-zinc-900 focus:ring-offset-0 cursor-pointer"
                />
              </th>

              {/* Age */}
              <th className="w-20 px-3 py-3 text-center">
                <button
                  type="button"
                  onClick={() => handleSort('age')}
                  className="group inline-flex items-center text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <span>AGE</span>
                  {renderSortIcon('age')}
                </button>
              </th>

              {/* Party / Supplier */}
              <th className="w-48 px-3 py-3 text-left">
                <button
                  type="button"
                  onClick={() => handleSort('party')}
                  className="group inline-flex items-center text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <span>SUPPLIER / PARTY</span>
                  {renderSortIcon('party')}
                </button>
              </th>

              {/* Material & Vehicle */}
              <th className="w-40 px-3 py-3 text-left">
                <button
                  type="button"
                  onClick={() => handleSort('quality')}
                  className="group inline-flex items-center text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <span>MATERIAL & VEHICLE</span>
                  {renderSortIcon('quality')}
                </button>
              </th>

              {/* Qty (MT) */}
              <th className="w-24 px-3 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('quantity')}
                  className="group inline-flex items-center justify-end text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors w-full"
                >
                  <span>QTY (MT)</span>
                  {renderSortIcon('quantity')}
                </button>
              </th>

              {/* Rate Spread */}
              <th className="w-44 px-3 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('rate_difference')}
                  className="group inline-flex items-center justify-end text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors w-full"
                >
                  <span>RATE SPREAD (BILL → ACTUAL)</span>
                  {renderSortIcon('rate_difference')}
                </button>
              </th>

              {/* RTGS Amount */}
              <th className="w-36 px-3 py-3 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('rtgs_amount')}
                  className="group inline-flex items-center justify-end text-[10.5px] font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors w-full"
                >
                  <span>RTGS PAYABLE</span>
                  {renderSortIcon('rtgs_amount')}
                </button>
              </th>

              {/* Actions */}
              <th className="w-36 px-3 py-3 text-center text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                ACTIONS
              </th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((entry) => (
              <PendingTableRow
                key={entry.id}
                entry={entry}
                isSelected={selectedIds.includes(entry.id)}
                onToggleSelect={onToggleSelectRow}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onMarkAsPaid={onMarkAsPaid}
                agingDays={getAgingDays(entry.bill_date)}
              />
            ))}
          </tbody>

          {/* Totals Row */}
          <PendingTotalsRow
            totalEntries={data.length}
            totalQuantityMT={totals.totalQuantityMT}
            avgRateDiff={totals.avgRateDiff}
            netRtgsAmount={totals.netRtgsAmount}
          />
        </table>
      </div>

      {/* 2. MOBILE CARD STACK (< 640px) */}
      <div className="block sm:hidden divide-y divide-[#F0F1F3]">
        {paginatedData.map((entry) => {
          const isSelected = selectedIds.includes(entry.id)
          const agingDays = getAgingDays(entry.bill_date)
          const isCritical = agingDays > 15
          const diff = entry.rate_difference
          const isUnder = diff > 0
          const isOver = diff < 0
          const isExact = diff === 0

          return (
            <div
              key={entry.id}
              className={cn(
                'p-4 space-y-3 transition-colors',
                isSelected ? 'bg-amber-50/40' : 'bg-white',
                isCritical && !isSelected && 'bg-red-50/10'
              )}
            >
              {/* Top: Selection + Age + Party Details */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    aria-label={`Select bill ${entry.bill_number || entry.id}`}
                    checked={isSelected}
                    onChange={() => onToggleSelectRow(entry.id)}
                    className="h-4 w-4 rounded border-[#D1D5DB] text-zinc-900 focus:ring-zinc-900 mt-0.5 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-[#111827]">
                        {entry.party_code || entry.parties?.party_code || '—'}
                      </span>
                      {entry.bill_number && (
                        <span className="text-[10px] font-mono text-slate-400">
                          #{entry.bill_number}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#4B5563] truncate max-w-[160px]">
                      {entry.parties?.party_name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <span>{entry.qualities?.quality_name}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] font-semibold text-[#4B5563] bg-[#F4F5F6] border border-[#E5E7EB] rounded px-1.5 py-0.2">
                        {entry.lorry_number}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Age Risk Badge */}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold border shrink-0',
                    agingDays > 15
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : agingDays >= 7
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      agingDays > 15
                        ? 'bg-red-500 animate-pulse'
                        : agingDays >= 7
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    )}
                  />
                  <span>{agingDays}d</span>
                </span>
              </div>

              {/* Quantities and Rate Spread */}
              <div className="grid grid-cols-2 gap-2 bg-[#F8F9FA] p-2.5 rounded-lg text-xs border border-[#F0F1F3]">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                    Consignment
                  </span>
                  <span className="font-mono font-bold text-[#111827]">
                    {formatMT(entry.quantity_mt)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                    Spread (Bill → Actual)
                  </span>
                  <span className="font-mono text-[#4B5563] text-xs">
                    {formatRate(entry.bill_rate)} → {formatRate(entry.actual_rate)}
                  </span>
                </div>
              </div>

              {/* Diff & RTGS Amount */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">
                    Rate Diff
                  </span>
                  {isUnder && (
                    <span className="text-xs font-mono font-bold text-amber-700">
                      +₹{diff.toFixed(2)}/kg
                    </span>
                  )}
                  {isOver && (
                    <span className="text-xs font-mono font-bold text-rose-700">
                      -₹{Math.abs(diff).toFixed(2)}/kg
                    </span>
                  )}
                  {isExact && (
                    <span className="text-xs font-mono text-emerald-700">
                      Exact ₹0.00
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-amber-900/70 font-bold block">
                    RTGS Payable
                  </span>
                  <span className="text-base font-mono font-bold text-amber-950">
                    {formatCurrency(Math.abs(entry.rtgs_amount))}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#F0F1F3]">
                <button
                  type="button"
                  onClick={() => onView(entry)}
                  className="p-1.5 rounded-md border border-[#E5E7EB] hover:bg-slate-50 text-slate-600"
                  title="View"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="p-1.5 rounded-md border border-[#E5E7EB] hover:bg-blue-50 text-slate-600 hover:text-blue-600"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMarkAsPaid(entry)}
                  className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1"
                  title="Settle Slip"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Settle</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry)}
                  className="p-1.5 rounded-md border border-[#E5E7EB] hover:bg-red-50 text-slate-600 hover:text-red-600"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. TABLE FOOTER / PAGINATION */}
      <div className="px-4 sm:px-6 py-3.5 bg-white border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Info + Page size selector */}
        <div className="flex items-center gap-3 text-slate-500">
          <span>
            Showing <strong className="text-slate-800 font-mono">{currentPage * pageSize + 1}</strong>–
            <strong className="text-slate-800 font-mono">
              {Math.min((currentPage + 1) * pageSize, sortedData.length)}
            </strong>{' '}
            of <strong className="text-slate-800 font-mono">{sortedData.length}</strong> slips
          </span>
          <span className="text-slate-200">│</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPageIndex(0)
              }}
              className="px-2 py-0.5 bg-white border border-[#E5E7EB] rounded-md text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-black/10 cursor-pointer shadow-2xs"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPageIndex(0)}
            disabled={currentPage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i)
            .filter((p) => {
              return (
                p === 0 ||
                p === totalPages - 1 ||
                Math.abs(p - currentPage) <= 1
              )
            })
            .map((p, idx, arr) => {
              const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
              return (
                <div key={p} className="flex items-center">
                  {showEllipsis && (
                    <span className="px-1 text-slate-400 text-xs">...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPageIndex(p)}
                    className={cn(
                      'w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold transition-colors',
                      currentPage === p
                        ? 'bg-zinc-900 text-white border border-zinc-900 shadow-2xs'
                        : 'border border-[#E5E7EB] text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {p + 1}
                  </button>
                </div>
              )
            })}

          <button
            type="button"
            onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setPageIndex(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
