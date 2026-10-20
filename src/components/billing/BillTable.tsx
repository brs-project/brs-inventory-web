import { formatISTDate, formatISTDateTime } from '@lib/dateUtils'
import { useState, useMemo } from 'react'
import {
  Eye,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CreditCard,
  ChevronDown,
  Layers,
  List,
  CheckCircle,
} from 'lucide-react'
import { formatCurrency, formatMT } from '@lib/billCalculations'
import { cn } from '@lib/utils'
import type { BillEntry } from '@types'

export interface BillTableProps {
  data: BillEntry[]
  onView: (entry: BillEntry) => void
  onEdit: (entry: BillEntry) => void
  onDelete: (entry: BillEntry) => void
  onMarkAsPaid?: (entry: BillEntry) => void
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

type ViewMode = 'grouped' | 'flat'

export function BillTable({
  data,
  onView,
  onEdit,
  onDelete,
  onMarkAsPaid,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}: BillTableProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [sortField, setSortField] = useState<keyof BillEntry>('bill_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Collapsed states for groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    exact: false,
  })

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }))
  }

  // Sorting handler
  const handleSort = (field: keyof BillEntry) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Sorted list
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aVal = a[sortField]
      let bVal = b[sortField]

      if (sortField === 'bill_date' || sortField === 'created_at') {
        aVal = new Date(aVal as string).getTime()
        bVal = new Date(bVal as string).getTime()
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      }

      return 0
    })
  }, [data, sortField, sortOrder])

  // Grouped dataset by billing type
  const groupedData = useMemo(() => {
    const under = sortedData.filter((e) => e.billing_type === 'under')
    const over = sortedData.filter((e) => e.billing_type === 'over')
    const exact = sortedData.filter((e) => e.billing_type === 'exact')

    return [
      {
        key: 'under',
        title: 'Under Billing (RTGS Payable)',
        dotColor: 'bg-orange-500',
        textColor: 'text-orange-700',
        borderColor: 'border-l-orange-400',
        bgSubtle: 'bg-orange-50/50',
        entries: under,
        totalQtyMT: under.reduce((sum, e) => sum + e.quantity_mt, 0),
        totalAmount: under.reduce((sum, e) => sum + e.rtgs_amount, 0),
      },
      {
        key: 'over',
        title: 'Over Billing (Refund / Debit Memo)',
        dotColor: 'bg-red-500',
        textColor: 'text-red-700',
        borderColor: 'border-l-red-400',
        bgSubtle: 'bg-red-50/50',
        entries: over,
        totalQtyMT: over.reduce((sum, e) => sum + e.quantity_mt, 0),
        totalAmount: over.reduce((sum, e) => sum + e.rtgs_amount, 0),
      },
      {
        key: 'exact',
        title: 'Exact Rate Match',
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-700',
        borderColor: 'border-l-emerald-400',
        bgSubtle: 'bg-emerald-50/50',
        entries: exact,
        totalQtyMT: exact.reduce((sum, e) => sum + e.quantity_mt, 0),
        totalAmount: 0,
      },
    ].filter((g) => g.entries.length > 0)
  }, [sortedData])

  // Overall totals
  const overallTotalMT = useMemo(
    () => data.reduce((sum, e) => sum + (e.quantity_mt || 0), 0),
    [data]
  )
  const overallNetRTGS = useMemo(
    () => data.reduce((sum, e) => sum + (e.rtgs_amount || 0), 0),
    [data]
  )

  // Quality chip color helper
  const getQualityBadgeColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'scrap':
        return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'heavy':
        return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'processed':
        return 'bg-purple-50 text-purple-600 border-purple-100'
      case 'primary':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  // Quick payment status pill helper
  const renderStatusBadge = (status: string, billingType: string) => {
    if (billingType === 'exact') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
          N/A
        </span>
      )
    }
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-2.5 h-2.5" />
          Paid
        </span>
      )
    }
    if (status === 'partial') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-50 text-violet-700 border border-violet-200">
          Partial
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    )
  }

  // Selection helpers
  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onSelectionChange) return
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#ECECEE] p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400 mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">No bill entries found</h3>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Try adjusting your search query, filter criteria, or record a new bill entry.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 select-none">
      {/* TABLE TOOLBAR */}
      <div className="bg-white rounded-t-2xl border border-b-0 border-[#ECECEE] px-4 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-gray-900">
            {data.length} transactions
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500 flex items-center gap-1">
            <span>Sorted by</span>
            <button
              type="button"
              onClick={() => handleSort('bill_date')}
              className="font-medium text-gray-800 hover:underline inline-flex items-center gap-0.5"
            >
              <span>Date</span>
              {sortField === 'bill_date' && (
                sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
              )}
            </button>
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-[#ECECEE] p-0.5 bg-gray-50 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all',
                viewMode === 'grouped'
                  ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <Layers className="w-3 h-3" />
              <span>Grouped Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={cn(
                'px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all',
                viewMode === 'flat'
                  ? 'bg-white text-gray-900 shadow-2xs font-semibold'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <List className="w-3 h-3" />
              <span>Flat Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="bg-white rounded-b-none border border-[#ECECEE] shadow-2xs overflow-hidden">
        {/* GROUPED LEDGER VIEW */}
        {viewMode === 'grouped' ? (
          <div className="divide-y divide-gray-100">
            {groupedData.map((group) => {
              const isCollapsed = collapsedGroups[group.key]
              return (
                <div key={group.key} className="bg-white">
                  {/* GROUP HEADER */}
                  <div
                    onClick={() => toggleGroup(group.key)}
                    className="px-4 py-2.5 bg-[#FCFCFD] hover:bg-gray-100/70 border-b border-[#ECECEE] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition-transform"
                      >
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-150',
                            isCollapsed && '-rotate-90'
                          )}
                        />
                      </button>

                      <span className={cn('w-2 h-2 rounded-full', group.dotColor)} />

                      <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                        {group.title}
                      </span>

                      <span className="text-[11px] font-mono text-gray-400 ml-1">
                        ({group.entries.length} entries · {formatMT(group.totalQtyMT)})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={cn('text-xs font-bold font-mono', group.textColor)}>
                        Subtotal: {formatCurrency(Math.abs(group.totalAmount))}
                      </span>
                    </div>
                  </div>

                  {/* GROUP ROWS */}
                  {!isCollapsed && (
                    <div className="divide-y divide-gray-100/70">
                      {group.entries.map((entry) => (
                        <div
                          key={entry.id}
                          onClick={() => onView(entry)}
                          className={cn(
                            'h-12 px-4 flex items-center justify-between text-xs hover:bg-[#F7F7F8]/80 cursor-pointer transition-colors group relative border-l-2',
                            group.borderColor
                          )}
                        >
                          {/* Left Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Checkbox if selectable */}
                            {selectable && (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(entry.id)}
                                onChange={(e) => handleSelectOne(entry.id, e as any)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-black"
                              />
                            )}

                            {/* Date */}
                            <div className="flex flex-col w-20 shrink-0">
                              <span className="font-mono text-[11px] text-gray-700 font-semibold">
                                {formatISTDate(entry.bill_date)}
                              </span>
                              {entry.created_at ? (
                                <span className="font-mono text-[9.5px] text-gray-400 truncate" title="Recorded At (IST)">
                                  {formatISTDateTime(entry.created_at)}
                                </span>
                              ) : null}
                            </div>

                            {/* Party */}
                            <div className="truncate min-w-0 max-w-[200px] flex items-center gap-1.5">
                              <span className="font-mono font-bold text-gray-900 shrink-0">
                                {entry.party_code}
                              </span>
                              <span className="text-gray-300 shrink-0">·</span>
                              <span className="text-gray-600 truncate group-hover:underline">
                                {entry.parties?.party_name || '—'}
                              </span>
                            </div>

                            {/* Quality Grade */}
                            <div className="hidden md:flex items-center gap-1 shrink-0">
                              <span className="text-gray-700 font-medium">
                                {entry.qualities?.quality_name || '—'}
                              </span>
                              {entry.qualities?.category && (
                                <span
                                  className={cn(
                                    'text-[9px] px-1.5 py-0.2 rounded-full border font-normal',
                                    getQualityBadgeColor(entry.qualities.category)
                                  )}
                                >
                                  {entry.qualities.category}
                                </span>
                              )}
                            </div>

                            {/* Lorry Plate */}
                            <span className="hidden lg:inline-block font-mono text-[11px] bg-gray-50 border border-gray-200 text-gray-700 px-1.5 py-0.5 rounded shrink-0">
                              {entry.lorry_number}
                            </span>
                          </div>

                          {/* Center / Right Financial Figures */}
                          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                            {/* Quantity */}
                            <div className="text-right">
                              <span className="font-mono font-medium text-gray-800 tabular-nums">
                                {entry.quantity_mt.toFixed(3)}
                              </span>
                              <span className="text-[10px] text-gray-400 ml-0.5">MT</span>
                            </div>

                            {/* Rate Difference */}
                            <div className="hidden sm:block text-right w-20">
                              <span
                                className={cn(
                                  'font-mono text-xs font-semibold',
                                  entry.billing_type === 'under' && 'text-orange-600',
                                  entry.billing_type === 'over' && 'text-red-500',
                                  entry.billing_type === 'exact' && 'text-emerald-600'
                                )}
                              >
                                {entry.rate_difference > 0 ? '+' : ''}
                                ₹{entry.rate_difference.toFixed(2)}
                                {entry.billing_type === 'under' && ' ↑'}
                                {entry.billing_type === 'over' && ' ↓'}
                                {entry.billing_type === 'exact' && ' ✓'}
                              </span>
                            </div>

                            {/* RTGS Amount (Hero Figure) */}
                            <div className="text-right w-24 sm:w-28">
                              <span
                                className={cn(
                                  'font-mono font-bold text-[13px] tabular-nums',
                                  entry.billing_type === 'under' && 'text-orange-600',
                                  entry.billing_type === 'over' && 'text-red-600',
                                  entry.billing_type === 'exact' && 'text-emerald-600'
                                )}
                              >
                                {formatCurrency(Math.abs(entry.rtgs_amount))}
                              </span>
                            </div>

                            {/* Status */}
                            <div className="w-16 text-center">
                              {renderStatusBadge(entry.payment_status, entry.billing_type)}
                            </div>

                            {/* Hover-Revealed Row Actions */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100 w-20 justify-end">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onView(entry)
                                }}
                                title="View details"
                                className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-200 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit(entry)
                                }}
                                title="Edit entry"
                                className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-200 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {entry.payment_status === 'pending' && onMarkAsPaid && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMarkAsPaid(entry)
                                  }}
                                  title="Mark as paid"
                                  className="p-1 rounded text-orange-500 hover:text-orange-700 hover:bg-orange-50 transition-colors"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete(entry)
                                }}
                                title="Delete entry"
                                className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          /* FLAT TABLE VIEW */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#FCFCFD] border-b border-[#ECECEE] text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">#</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Supplier / Party</th>
                  <th className="px-3 py-2.5">Quality</th>
                  <th className="px-3 py-2.5">Lorry No</th>
                  <th className="px-3 py-2.5 text-right">Quantity</th>
                  <th className="px-3 py-2.5 text-right">Bill Rate</th>
                  <th className="px-3 py-2.5 text-right">Actual Rate</th>
                  <th className="px-3 py-2.5 text-right">Rate Diff</th>
                  <th className="px-3 py-2.5 text-right">RTGS Amount</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                  <th className="px-3 py-2.5 text-right w-16">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedData.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    onClick={() => onView(entry)}
                    className="h-11 hover:bg-[#F7F7F8] cursor-pointer transition-colors group"
                  >
                    <td className="px-3 py-2 text-center text-gray-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2 font-mono text-gray-600">
                      {formatISTDate(entry.bill_date)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-mono font-bold text-gray-900 mr-1.5">
                        {entry.party_code}
                      </span>
                      <span className="text-gray-500 group-hover:underline">
                        {entry.parties?.party_name || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700">
                      {entry.qualities?.quality_name || '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-gray-600">
                      {entry.lorry_number}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-medium text-gray-900">
                      {entry.quantity_mt.toFixed(3)} MT
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-500">
                      ₹{entry.bill_rate.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-500">
                      ₹{entry.actual_rate.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2 text-right font-mono font-semibold',
                        entry.billing_type === 'under' && 'text-orange-600',
                        entry.billing_type === 'over' && 'text-red-500',
                        entry.billing_type === 'exact' && 'text-emerald-600'
                      )}
                    >
                      {entry.rate_difference > 0 ? '+' : ''}
                      ₹{entry.rate_difference.toFixed(2)}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2 text-right font-mono font-bold',
                        entry.billing_type === 'under' && 'text-orange-600',
                        entry.billing_type === 'over' && 'text-red-600',
                        entry.billing_type === 'exact' && 'text-emerald-600'
                      )}
                    >
                      {formatCurrency(Math.abs(entry.rtgs_amount))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {renderStatusBadge(entry.payment_status, entry.billing_type)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onView(entry)
                          }}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(entry)
                          }}
                          className="p-1 hover:bg-gray-200 rounded text-gray-500"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(entry)
                          }}
                          className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. DARK FOOTER TOTALS BAR */}
      <div className="bg-[#17181A] text-white rounded-b-2xl px-5 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="font-semibold text-white">
            {data.length} total entries
          </span>
          <span>·</span>
          <span className="font-mono text-white/90">
            {formatMT(overallTotalMT)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/60 uppercase tracking-wider text-[10px] font-semibold">
            Net RTGS:
          </span>
          <span className="text-base sm:text-lg font-bold font-mono text-white">
            {formatCurrency(Math.abs(overallNetRTGS))}
          </span>
        </div>
      </div>
    </div>
  )
}

export default BillTable
