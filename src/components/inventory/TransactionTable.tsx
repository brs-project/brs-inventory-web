import { formatISTDate, formatISTDateTime } from '@lib/dateUtils'
import { useState, useMemo, useEffect, useRef, Fragment } from 'react'
import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  Columns3,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarDays,
  Search,
  RotateCcw,
} from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { cn } from '@lib/utils'
import type { InventoryTransaction } from '@types'

const LOCAL_STORAGE_VISIBILITY_KEY = 'inventory_table_column_visibility_v2'

export interface TransactionTableProps {
  data: InventoryTransaction[]
  isLoading?: boolean
  totalFilteredCount?: number
  onViewDetail: (txn: InventoryTransaction) => void
  onDeleteTxn: (txn: InventoryTransaction) => void
  onResetFilters?: () => void
}

export function TransactionTable({
  data,
  isLoading = false,
  totalFilteredCount,
  onViewDetail,
  onDeleteTxn,
  onResetFilters,
}: TransactionTableProps) {
  const { user } = useAuth()
  const canDelete = user?.role === 'admin' || user?.role === 'manager'

  // Column visibility state persisted in localStorage
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_VISIBILITY_KEY)
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return {}
  })

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'transaction_date', desc: true },
  ])
  const [pageSize, setPageSize] = useState<number>(25)
  const [groupByDate, setGroupByDate] = useState<boolean>(true)

  // Column popover toggle
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const colMenuRef = useRef<HTMLDivElement>(null)

  // Persist column visibility
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_VISIBILITY_KEY, JSON.stringify(columnVisibility))
    } catch {
      // ignore
    }
  }, [columnVisibility])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setColMenuOpen(false)
      }
    }
    if (colMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [colMenuOpen])

  // Aggregate totals
  const totals = useMemo(() => {
    const inward = data.reduce((sum, r) => sum + (r.inward_weight || 0), 0)
    const godown = data.reduce((sum, r) => sum + (r.godown_weight || 0), 0)
    const totalLoad = data.reduce(
      (sum, r) =>
        sum +
        (r.total_weight !== undefined
          ? r.total_weight
          : (r.inward_weight || 0) + (r.godown_weight || 0)),
      0
    )
    const outward = data.reduce((sum, r) => sum + (r.outward_weight || 0), 0)
    const variance = data.reduce((sum, r) => sum + (r.weight_variance || 0), 0)
    const dispatchVariance = data.reduce(
      (sum, r) =>
        sum +
        (r.dispatch_variance ??
          ((r.outward_weight || 0) - ((r.inward_weight || 0) + (r.godown_weight || 0)))),
      0
    )
    const netStock = data.reduce((sum, r) => sum + (r.net_stock || 0), 0)

    return {
      inward: Math.round(inward * 1000) / 1000,
      godown: Math.round(godown * 1000) / 1000,
      totalLoad: Math.round(totalLoad * 1000) / 1000,
      variance: Math.round(variance * 1000) / 1000,
      outward: Math.round(outward * 1000) / 1000,
      dispatchVariance: Math.round(dispatchVariance * 1000) / 1000,
      netStock: Math.round(netStock * 1000) / 1000,
    }
  }, [data])

  // Quality category badge styling
  const getQualityBadge = (cat?: string) => {
    if (!cat) return null
    const upper = cat.toUpperCase()
    let badgeClass = 'bg-blue-50 text-blue-600 border-blue-100'
    if (upper.includes('HEAVY')) {
      badgeClass = 'bg-orange-50 text-orange-600 border-orange-100'
    } else if (upper.includes('PROCESS')) {
      badgeClass = 'bg-purple-50 text-purple-600 border-purple-100'
    } else if (upper.includes('PRIMARY')) {
      badgeClass = 'bg-green-50 text-green-600 border-green-100'
    }
    return (
      <span
        className={cn(
          'text-[10px] px-1.5 py-0.2 rounded border font-medium uppercase shrink-0',
          badgeClass
        )}
      >
        {cat}
      </span>
    )
  }

  // Column definitions
  const columns = useMemo<ColumnDef<InventoryTransaction>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => (
          <span className="text-slate-400 font-mono text-xs text-center block w-full">
            {row.index + 1}
          </span>
        ),
        enableSorting: false,
        size: 48,
      },
      {
        accessorKey: 'transaction_date',
        header: 'Date & Time (IST)',
        cell: ({ row }) => {
          return (
            <div className="space-y-0.5 whitespace-nowrap">
              <span className="font-semibold text-xs text-slate-800 block">
                {formatISTDate(row.original.transaction_date)}
              </span>
              {row.original.created_at ? (
                <span className="text-[10px] text-slate-400 font-mono block" title="Created At (IST)">
                  {formatISTDateTime(row.original.created_at)}
                </span>
              ) : null}
            </div>
          )
        },
        size: 130,
      },
      {
        id: 'party_name',
        accessorFn: (row) => row.parties?.party_name || row.party_id,
        header: 'Party',
        cell: ({ row }) => {
          const name = row.original.parties?.party_name || row.original.party_id
          const code = row.original.parties?.party_code
          return (
            <div className="max-w-[170px] truncate" title={name}>
              <span className="text-xs font-semibold text-slate-800 block truncate">{name}</span>
              {code && <span className="text-[10px] font-mono text-slate-400 block">{code}</span>}
            </div>
          )
        },
        size: 170,
      },
      {
        id: 'quality_name',
        accessorFn: (row) => row.qualities?.quality_name || row.quality_id,
        header: 'Quality',
        cell: ({ row }) => {
          const name = row.original.qualities?.quality_name || row.original.quality_id
          const cat = row.original.qualities?.category
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-xs font-medium text-slate-700">{name}</span>
              {getQualityBadge(cat)}
            </div>
          )
        },
        size: 140,
      },
      {
        accessorKey: 'bill_number',
        header: 'Bill No',
        cell: ({ row }) => {
          const bill = row.original.bill_number
          return (
            <span
              className={cn(
                'font-mono text-xs text-slate-500 whitespace-nowrap',
                row.original.status === 'cancelled' && 'line-through'
              )}
              title={bill || 'No bill number'}
            >
              {bill || '—'}
            </span>
          )
        },
        size: 130,
      },
      {
        id: 'lorry_in',
        accessorFn: (row) => row.vehicles_in?.lorry_number || row.vehicle_in_id,
        header: 'Lorry In',
        cell: ({ row }) => {
          const lorry = row.original.vehicles_in?.lorry_number || row.original.vehicle_in_id
          if (!lorry) return <span className="text-slate-300 text-center block">—</span>
          return (
            <span className="bg-slate-100 text-slate-700 rounded px-2 py-0.5 text-[11px] font-mono font-medium tracking-wider whitespace-nowrap inline-block">
              {lorry}
            </span>
          )
        },
        size: 130,
        enableSorting: false,
      },
      {
        accessorKey: 'inward_weight',
        header: 'Inward MT',
        cell: ({ row }) => {
          const val = row.original.inward_weight
          if (!val) return <span className="text-slate-300 text-right block font-normal">—</span>
          return (
            <span className="font-mono font-semibold text-xs text-right block text-slate-800 tabular-nums whitespace-nowrap">
              {val.toFixed(3)}
            </span>
          )
        },
        size: 100,
      },
      {
        accessorKey: 'godown_weight',
        header: 'Godown MT',
        cell: ({ row }) => {
          const val = row.original.godown_weight
          if (!val) return <span className="text-slate-300 text-right block font-normal">—</span>
          return (
            <span className="font-mono font-semibold text-xs text-right block text-slate-800 tabular-nums whitespace-nowrap">
              {val.toFixed(3)}
            </span>
          )
        },
        size: 100,
      },
      {
        accessorKey: 'weight_variance',
        header: 'Variance',
        cell: ({ row }) => {
          const v = row.original.weight_variance
          const isZero = v === 0
          const isLoss = v > 0
          return (
            <div className="flex items-center justify-end gap-1 font-mono font-semibold text-xs tabular-nums whitespace-nowrap">
              {isLoss && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
              <span
                className={cn(
                  isLoss ? 'text-orange-600' : isZero ? 'text-green-600' : 'text-blue-600'
                )}
              >
                {isLoss ? `+${v.toFixed(3)}` : v.toFixed(3)}
              </span>
            </div>
          )
        },
        size: 95,
      },
      {
        id: 'lorry_out',
        accessorFn: (row) => row.vehicles_out?.lorry_number || row.vehicle_out_id,
        header: 'Lorry Out',
        cell: ({ row }) => {
          const lorry = row.original.vehicles_out?.lorry_number || row.original.vehicle_out_id
          if (!lorry) return <span className="text-slate-300 text-center block">—</span>
          return (
            <span className="bg-slate-100 text-slate-700 rounded px-2 py-0.5 text-[11px] font-mono font-medium tracking-wider whitespace-nowrap inline-block">
              {lorry}
            </span>
          )
        },
        size: 130,
        enableSorting: false,
      },
      {
        accessorKey: 'outward_weight',
        header: 'Outward MT',
        cell: ({ row }) => {
          const val = row.original.outward_weight
          if (!val) return <span className="text-slate-300 text-right block font-normal">—</span>
          return (
            <span className="font-mono font-semibold text-xs text-right block text-slate-800 tabular-nums whitespace-nowrap">
              {val.toFixed(3)}
            </span>
          )
        },
        size: 105,
      },
      {
        accessorKey: 'net_stock',
        header: 'Net Stock',
        cell: ({ row }) => {
          const ns = row.original.net_stock
          return (
            <span
              className={cn(
                'font-mono font-bold text-xs text-right block tabular-nums whitespace-nowrap',
                ns >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {ns > 0 ? `+${ns.toFixed(3)}` : ns.toFixed(3)}
            </span>
          )
        },
        size: 100,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          if (status === 'completed') {
            return (
              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                <span>✓</span> Done
              </span>
            )
          }
          if (status === 'draft') {
            return (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                <span>◌</span> Draft
              </span>
            )
          }
          return (
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
              <span>✕</span> Void
            </span>
          )
        },
        size: 90,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const txn = row.original
          return (
            <div
              className="flex items-center gap-0.5 justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onViewDetail(txn)}
                title="View details"
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-100 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>

              <Link
                to={`/inventory/edit/${txn.id}`}
                title="Edit transaction"
                className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-100 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Link>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDeleteTxn(txn)}
                  title="Delete transaction"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        },
        size: 100,
      },
    ],
    [canDelete, onViewDetail, onDeleteTxn]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Date sorting check for group header
  const isSortedByDate = sorting.length > 0 && sorting[0].id === 'transaction_date'

  // Process rows with date grouping for table rendering
  const tableRows = table.getRowModel().rows
  const visibleLeafColumns = table.getVisibleLeafColumns()

  // Pagination calculations
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount() || 1
  const startRow = (currentPage - 1) * pageSize + 1
  const endRow = Math.min(currentPage * pageSize, data.length)

  // Generate numbered pagination range
  const getPaginationItems = () => {
    const items: (number | string)[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      if (currentPage <= 3) {
        items.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        items.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        items.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    return items
  }

  // Column definitions list for visibility toggle
  const toggleableColumns = table
    .getAllLeafColumns()
    .filter((col) => col.id !== 'index' && col.id !== 'actions')

  return (
    <div className="space-y-4 select-none">
      {/* ─────────────────────────────────────────────────────────────
          TABLE WRAPPER CARD
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-5 py-3 border-b border-slate-100 gap-3 bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium">
              Showing <strong className="text-slate-800 font-bold">{data.length}</strong>{' '}
              {totalFilteredCount && totalFilteredCount > data.length ? (
                <>of {totalFilteredCount} transactions</>
              ) : (
                <>transactions</>
              )}
            </span>

            {/* Date Grouping Switch */}
            {isSortedByDate && (
              <button
                type="button"
                onClick={() => setGroupByDate(!groupByDate)}
                className={cn(
                  'ml-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer',
                  groupByDate
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                )}
                title="Toggle visual date grouping headers"
              >
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                <span>Group by Date</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Columns Visibility Popover */}
            <div className="relative" ref={colMenuRef}>
              <button
                type="button"
                onClick={() => setColMenuOpen(!colMenuOpen)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer',
                  colMenuOpen
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                )}
              >
                <Columns3 className="h-3.5 w-3.5 text-slate-500" />
                <span>Columns</span>
              </button>

              {colMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 w-60 flex flex-col space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100 text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Columns3 className="h-3.5 w-3.5 text-blue-600" />
                      Visible Columns
                    </span>
                    <button
                      type="button"
                      onClick={() => table.toggleAllColumnsVisible(true)}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer font-semibold"
                    >
                      Show All
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-0.5 p-0.5">
                    {toggleableColumns.map((column) => {
                      const isVisible = column.getIsVisible()
                      const label = column.columnDef.header
                        ? String(column.columnDef.header)
                        : column.id.replace(/_/g, ' ')

                      return (
                        <label
                          key={column.id}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition select-none',
                            isVisible ? 'text-slate-800 font-medium' : 'text-slate-400'
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={column.getToggleVisibilityHandler()}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span className="capitalize">{label}</span>
                        </label>
                      )
                    })}
                  </div>

                  <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setColumnVisibility({})
                        localStorage.removeItem(LOCAL_STORAGE_VISIBILITY_KEY)
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Reset to Default
                    </button>
                    <button
                      type="button"
                      onClick={() => setColMenuOpen(false)}
                      className="text-[11px] text-blue-600 font-semibold cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-1 text-xs">
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value)
                  setPageSize(newSize)
                  table.setPageSize(newSize)
                }}
                className="h-8 px-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            DESKTOP & TABLET TABLE VIEW (hidden on small mobile)
            ───────────────────────────────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            {/* Table Header */}
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wide text-xs sticky top-0 z-10 select-none">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const isSorted = header.column.getIsSorted()
                    const isRight =
                      header.id.includes('weight') ||
                      header.id.includes('variance') ||
                      header.id.includes('net_stock')
                    const isCenter =
                      header.id === 'index' ||
                      header.id.includes('lorry') ||
                      header.id === 'status' ||
                      header.id === 'actions'

                    return (
                      <th
                        key={header.id}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        style={{ width: header.getSize() }}
                        className={cn(
                          'py-3 px-4 select-none whitespace-nowrap font-semibold',
                          isRight ? 'text-right' : isCenter ? 'text-center' : 'text-left',
                          canSort && 'cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors'
                        )}
                      >
                        <div
                          className={cn(
                            'inline-flex items-center gap-1',
                            isRight && 'justify-end w-full',
                            isCenter && 'justify-center w-full'
                          )}
                        >
                          <span>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {canSort && (
                            <span className="shrink-0">
                              {isSorted === 'asc' ? (
                                <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
                              ) : isSorted === 'desc' ? (
                                <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                              ) : (
                                <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                /* Skeleton rows */
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="h-[52px] border-b border-slate-100">
                    {visibleLeafColumns.map((col, j) => (
                      <td key={j} className="py-3 px-4">
                        <div
                          className="h-4 bg-slate-200 rounded-md animate-pulse"
                          style={{ width: `${Math.max(40, col.getSize() - 30)}px` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tableRows.length > 0 ? (
                (() => {
                  let lastDateGroup: string | null = null

                  return tableRows.map((row) => {
                    const txn = row.original
                    const isDraft = txn.status === 'draft'
                    const isCancelled = txn.status === 'cancelled'
                    const rowDateKey = format(new Date(txn.transaction_date), 'yyyy-MM-dd')

                    // Date grouping header calculation
                    let showDateHeader = false
                    if (groupByDate && isSortedByDate) {
                      if (lastDateGroup !== rowDateKey) {
                        showDateHeader = true
                        lastDateGroup = rowDateKey
                      }
                    }

                    // Count how many entries in this group on the current page
                    const groupEntriesCount = showDateHeader
                      ? tableRows.filter(
                          (r) =>
                            format(new Date(r.original.transaction_date), 'yyyy-MM-dd') ===
                            rowDateKey
                        ).length
                      : 0

                    return (
                      <Fragment key={row.id}>
                        {showDateHeader && (
                          <tr className="bg-slate-50/80 border-y border-slate-200/90 select-none">
                            <td
                              colSpan={visibleLeafColumns.length}
                              className="px-4 py-2 text-left"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-xs font-semibold text-slate-700">
                                    {formatISTDate(txn.transaction_date)}
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400 font-medium">
                                  {groupEntriesCount} {groupEntriesCount === 1 ? 'entry' : 'entries'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        <tr
                          onClick={() => onViewDetail(txn)}
                          className={cn(
                            'h-[52px] border-b border-slate-100 transition-colors duration-100 cursor-pointer',
                            isDraft
                              ? 'border-l-2 border-l-amber-400 bg-amber-50/15 hover:bg-amber-50/40'
                              : isCancelled
                              ? 'opacity-60 bg-slate-50/50 hover:bg-slate-100/50'
                              : 'bg-white hover:bg-slate-50/70'
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="py-2.5 px-4 align-middle">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      </Fragment>
                    )
                  })
                })()
              ) : (
                /* Empty state */
                <tr>
                  <td colSpan={visibleLeafColumns.length} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Search className="w-6 h-6 text-slate-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-medium text-slate-700">No transactions found</p>
                        <p className="text-xs text-slate-400">
                          No records match your current search and filter settings.
                        </p>
                      </div>
                      {onResetFilters && (
                        <button
                          type="button"
                          onClick={onResetFilters}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Reset Filters</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* Styled Totals Row at bottom */}
            {data.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-xs font-bold text-slate-800">
                <tr className="h-11">
                  <td className="py-2.5 px-4 text-xs font-bold text-slate-500 text-center">Σ</td>
                  <td colSpan={3} className="py-2.5 px-4 text-xs font-bold uppercase text-slate-600 tracking-wide">
                    TOTALS ({data.length} {data.length === 1 ? 'entry' : 'entries'})
                  </td>

                  {/* Dynamic alignment for remaining visible columns */}
                  {visibleLeafColumns.slice(4).map((col) => {
                    if (col.id === 'inward_weight') {
                      return (
                        <td key={col.id} className="py-2.5 px-4 text-right font-mono font-bold text-sm text-sky-600 tabular-nums">
                          {totals.inward.toFixed(3)}
                        </td>
                      )
                    }
                    if (col.id === 'godown_weight') {
                      return (
                        <td key={col.id} className="py-2.5 px-4 text-right font-mono font-bold text-sm text-slate-700 tabular-nums">
                          {totals.godown.toFixed(3)}
                        </td>
                      )
                    }
                    if (col.id === 'weight_variance') {
                      return (
                        <td
                          key={col.id}
                          className={cn(
                            'py-2.5 px-4 text-right font-mono font-bold text-sm tabular-nums',
                            totals.variance > 0
                              ? 'text-orange-600'
                              : totals.variance < 0
                              ? 'text-blue-600'
                              : 'text-green-600'
                          )}
                        >
                          {totals.variance > 0 ? `+${totals.variance.toFixed(3)}` : totals.variance.toFixed(3)}
                        </td>
                      )
                    }
                    if (col.id === 'outward_weight') {
                      return (
                        <td key={col.id} className="py-2.5 px-4 text-right font-mono font-bold text-sm text-amber-600 tabular-nums">
                          {totals.outward.toFixed(3)}
                        </td>
                      )
                    }
                    if (col.id === 'net_stock') {
                      return (
                        <td
                          key={col.id}
                          className={cn(
                            'py-2.5 px-4 text-right font-mono font-bold text-sm tabular-nums',
                            totals.netStock >= 0 ? 'text-green-600' : 'text-red-600'
                          )}
                        >
                          {totals.netStock > 0 ? `+${totals.netStock.toFixed(3)}` : totals.netStock.toFixed(3)}
                        </td>
                      )
                    }
                    return <td key={col.id} className="py-2.5 px-4" />
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            MOBILE CARD LIST VIEW (< 768px)
            ───────────────────────────────────────────────────────────── */}
        <div className="block md:hidden divide-y divide-slate-100">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-10 bg-slate-100 rounded" />
              </div>
            ))
          ) : tableRows.length > 0 ? (
            tableRows.map((row) => {
              const txn = row.original
                            const partyName = txn.parties?.party_name || txn.party_id
              const partyCode = txn.parties?.party_code
              const qualityName = txn.qualities?.quality_name || txn.quality_id
              const qualityCat = txn.qualities?.category
              const lorryIn = txn.vehicles_in?.lorry_number || txn.vehicle_in_id
              const lorryOut = txn.vehicles_out?.lorry_number || txn.vehicle_out_id
              const variance = txn.weight_variance
              const netStock = txn.net_stock

              return (
                <div
                  key={txn.id}
                  onClick={() => onViewDetail(txn)}
                  className={cn(
                    'p-4 transition-colors cursor-pointer space-y-3',
                    txn.status === 'draft'
                      ? 'bg-amber-50/20 border-l-3 border-l-amber-400'
                      : txn.status === 'cancelled'
                      ? 'bg-slate-50/70 opacity-60'
                      : 'hover:bg-slate-50 bg-white'
                  )}
                >
                  {/* Card Header: Date + Bill No + Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {formatISTDate(row?.original?.transaction_date || txn?.transaction_date)}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {txn.bill_number || 'No Bill'}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {txn.status === 'completed' && (
                      <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-semibold px-2 py-0.2 rounded-full">
                        ✓ Done
                      </span>
                    )}
                    {txn.status === 'draft' && (
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.2 rounded-full">
                        ◌ Draft
                      </span>
                    )}
                    {txn.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-semibold px-2 py-0.2 rounded-full">
                        ✕ Void
                      </span>
                    )}
                  </div>

                  {/* Party & Quality */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {partyName}
                      </span>
                      {partyCode && (
                        <span className="text-[10px] font-mono text-slate-400">{partyCode}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-700">{qualityName}</span>
                      {getQualityBadge(qualityCat)}
                    </div>
                  </div>

                  {/* Lorries */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    {lorryIn && (
                      <span className="bg-slate-100 text-slate-700 rounded px-2 py-0.5 font-medium">
                        In: {lorryIn}
                      </span>
                    )}
                    {lorryOut && (
                      <span className="bg-slate-100 text-slate-700 rounded px-2 py-0.5 font-medium">
                        Out: {lorryOut}
                      </span>
                    )}
                  </div>

                  {/* Weights Strip */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Inward
                      </span>
                      <span className="font-mono font-bold text-sky-600">
                        {txn.inward_weight.toFixed(3)} MT
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Godown
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {txn.godown_weight.toFixed(3)} MT
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                        Variance
                      </span>
                      <span
                        className={cn(
                          'font-mono font-bold',
                          variance > 0
                            ? 'text-orange-600'
                            : variance < 0
                            ? 'text-blue-600'
                            : 'text-green-600'
                        )}
                      >
                        {variance > 0 ? `+${variance.toFixed(3)}` : variance.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Net Stock & Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-xs font-semibold">
                      <span className="text-slate-400 mr-1">Net Stock:</span>
                      <span
                        className={cn(
                          'font-mono font-bold',
                          netStock >= 0 ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        {netStock > 0 ? `+${netStock.toFixed(3)}` : netStock.toFixed(3)} MT
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onViewDetail(txn)}
                        className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        to={`/inventory/edit/${txn.id}`}
                        className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDeleteTxn(txn)}
                          className="w-7 h-7 rounded-md bg-red-50 text-red-600 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No transactions match your filters.
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            PAGINATION BAR
            ───────────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          {/* Left: Summary text */}
          <span className="text-sm text-slate-500">
            Showing <strong className="text-slate-800 font-semibold">{data.length > 0 ? startRow : 0}</strong>
            &ndash;
            <strong className="text-slate-800 font-semibold">{endRow}</strong> of{' '}
            <strong className="text-slate-800 font-semibold">{data.length}</strong> results
          </span>

          {/* Right: Clean Numbered Page Buttons */}
          <div className="flex items-center gap-1">
            {/* First Page button */}
            <button
              type="button"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Previous Page button */}
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Number Buttons */}
            {getPaginationItems().map((item, idx) => {
              if (item === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 text-xs"
                  >
                    &hellip;
                  </span>
                )
              }

              const pageNum = Number(item)
              const isActive = currentPage === pageNum

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => table.setPageIndex(pageNum - 1)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center justify-center',
                    isActive
                      ? 'bg-blue-600 text-white border border-blue-600 shadow-2xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}

            {/* Next Page button */}
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Last Page button */}
            <button
              type="button"
              onClick={() => table.setPageIndex(totalPages - 1)}
              disabled={!table.getCanNextPage()}
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionTable
