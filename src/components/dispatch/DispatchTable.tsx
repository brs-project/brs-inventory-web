import { formatISTDate, formatISTDateTime } from '@lib/dateUtils'
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { EmptyState } from '@components/ui/EmptyState'
import { SkeletonTable } from '@components/ui/Skeleton'
import type { DispatchEntry } from '@types'

export interface DispatchTableProps {
  data: DispatchEntry[]
  isLoading?: boolean
  onViewDetail: (dispatch: DispatchEntry) => void
  onDeleteDispatch: (dispatch: DispatchEntry) => void
}

export function DispatchTable({
  data,
  isLoading = false,
  onViewDetail,
  onDeleteDispatch,
}: DispatchTableProps) {
  const { user } = useAuth()
  const canDelete = user?.role === 'admin' || user?.role === 'manager'
  const canEdit = user?.role === 'admin' || user?.role === 'manager' || user?.role === 'operator'

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'dispatch_date', desc: true },
  ])
  const [pageSize, setPageSize] = useState<number>(25)

  // Totals computation
  const totalBillWeight = useMemo(() => {
    return data.reduce((sum, item) => sum + (item.bill_weight || 0), 0)
  }, [data])

  const uniquePartiesCount = useMemo(() => {
    const set = new Set<string>()
    for (const d of data) {
      if (d.party_id) set.add(d.party_id)
      if (d.parties?.party_name) set.add(d.parties.party_name)
    }
    return set.size
  }, [data])

  const columns = useMemo<ColumnDef<DispatchEntry>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => (
          <span className="text-zinc-400 font-mono text-xs font-medium block text-center">
            {row.index + 1}
          </span>
        ),
        enableSorting: false,
        size: 44,
      },
      {
        accessorKey: 'dispatch_date',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center justify-center gap-1 w-full text-center hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <span>DATE</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-zinc-900" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3 text-zinc-900" />
            ) : (
              <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          return (
            <div className="text-center space-y-0.5 whitespace-nowrap">
              <span className="font-mono text-xs font-semibold text-zinc-700 block">
                {formatISTDate(row.original.dispatch_date)}
              </span>
              {row.original.created_at ? (
                <span className="text-[10px] text-zinc-400 font-mono block" title="Created At (IST)">
                  {formatISTDateTime(row.original.created_at)}
                </span>
              ) : null}
            </div>
          )
        },
        size: 115,
      },
      {
        id: 'quality',
        accessorFn: (row) => row.qualities?.quality_name || row.quality_id,
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <span>QUALITY</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-zinc-900" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3 text-zinc-900" />
            ) : (
              <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const name = row.original.qualities?.quality_name || row.original.quality_id
          const cat = row.original.qualities?.category || 'Scrap'
          return (
            <div className="leading-tight space-y-0.5">
              <div className="font-medium text-zinc-900 text-[13px] whitespace-nowrap">
                {name}
              </div>
              <div>
                <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold uppercase bg-slate-100 text-slate-600 border border-slate-200/80">
                  {cat}
                </span>
              </div>
            </div>
          )
        },
        size: 130,
      },
      {
        accessorKey: 'lorry_number',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <span>LORRY NO</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-zinc-900" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3 text-zinc-900" />
            ) : (
              <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#F4F5F7] text-zinc-800 border border-[#E5E7EB] uppercase tracking-wide inline-block whitespace-nowrap shadow-2xs">
              {row.original.lorry_number}
            </span>
          </div>
        ),
        size: 140,
      },
      {
        accessorKey: 'bill_weight',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center justify-end gap-1 w-full text-right hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <span>BILL WT</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-zinc-900" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3 text-zinc-900" />
            ) : (
              <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-mono font-bold text-[13.5px] text-zinc-900 text-right tabular-nums whitespace-nowrap">
            {row.original.bill_weight.toFixed(3)}{' '}
            <span className="text-xs font-normal text-zinc-400">MT</span>
          </div>
        ),
        size: 110,
      },
      {
        id: 'party_name',
        accessorFn: (row) => row.parties?.party_name || row.party_id,
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <span>PARTY NAME</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-zinc-900" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3 text-zinc-900" />
            ) : (
              <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const name = row.original.parties?.party_name || row.original.party_id
          const code = row.original.parties?.party_code || row.original.party_id
          return (
            <div className="leading-tight space-y-0.5 max-w-[170px]" title={name}>
              <div className="font-semibold text-zinc-900 text-[13px] truncate">
                {name}
              </div>
              {code && (
                <div className="text-[10.5px] font-mono text-zinc-400">
                  {code}
                </div>
              )}
            </div>
          )
        },
        size: 170,
      },
      {
        accessorKey: 'bill_number',
        header: 'BILL NO',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-zinc-400 block whitespace-nowrap">
            {row.original.bill_number || '—'}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'transporter',
        header: 'TRANSPORTER',
        cell: ({ row }) => (
          <span
            className="italic text-xs text-zinc-600 block truncate max-w-[150px]"
            title={row.original.transporter}
          >
            {row.original.transporter}
          </span>
        ),
        size: 150,
      },
      {
        accessorKey: 'dispatch_bill_number',
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center justify-center gap-1 w-full text-center hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <span>DISPATCH BILL</span>
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3 text-zinc-900" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3 text-zinc-900" />
            ) : (
              <ArrowUpDown className="h-2.5 w-2.5 opacity-50" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md inline-block whitespace-nowrap">
              {row.original.dispatch_bill_number}
            </span>
          </div>
        ),
        size: 120,
      },
      {
        accessorKey: 'status',
        header: 'STATUS',
        cell: ({ row }) => {
          const s = row.original.status
          if (s === 'dispatched') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span>Dispatched</span>
              </span>
            )
          }
          if (s === 'draft') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Draft</span>
              </span>
            )
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Cancelled</span>
            </span>
          )
        },
        size: 110,
      },
      {
        id: 'actions',
        header: 'ACTIONS',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div
              className="flex items-center justify-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onViewDetail(item)}
                title="View Dispatch Details"
                aria-label={`View dispatch ${item.dispatch_bill_number}`}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              {canEdit && (
                <Link
                  to={`/dispatch/edit/${item.id}`}
                  title="Edit Dispatch"
                  aria-label={`Edit dispatch ${item.dispatch_bill_number}`}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-amber-50 text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDeleteDispatch(item)}
                  title="Delete Dispatch"
                  aria-label={`Delete dispatch ${item.dispatch_bill_number}`}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        },
        size: 100,
      },
    ],
    [canDelete, canEdit, onViewDetail, onDeleteDispatch]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Loading state
  if (isLoading) {
    return <SkeletonTable rows={8} cols={10} />
  }

  // Empty state
  if (data.length === 0) {
    return (
      <EmptyState
        title="No Dispatch Records Found"
        description="There are no outward dispatch records matching your current filter criteria or date range."
      />
    )
  }

  const currentPageRows = table.getRowModel().rows

  return (
    <div className="space-y-3 select-none">
      {/* 1. DESKTOP & TABLET VIEW (>= 768px) */}
      <div className="hidden md:block bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Header */}
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="bg-[#F4F5F7] border-b border-[#E5E7EB] text-zinc-500 text-[11px] font-semibold uppercase tracking-[0.06em]"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="px-3.5 py-3 border-b border-[#E5E7EB]"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-[#F0F1F3]">
              {currentPageRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onViewDetail(row.original)}
                  className="hover:bg-zinc-50/90 transition-colors cursor-pointer group text-xs text-zinc-700"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3.5 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Anchored Totals Footer Bar */}
        <div className="bg-[#111827] text-white px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="text-zinc-300 font-medium">
            <strong className="text-white font-mono">{data.length}</strong> dispatches recorded across{' '}
            <strong className="text-white font-mono">{uniquePartiesCount}</strong> unique buyers
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 uppercase font-semibold text-[11px] tracking-wider">
              Total Outward Tonnage:
            </span>
            <span className="font-mono font-bold text-white text-sm sm:text-base tabular-nums">
              {totalBillWeight.toFixed(3)} MT
            </span>
          </div>
        </div>
      </div>

      {/* 2. MOBILE CARD VIEW (< 768px) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {currentPageRows.map((row) => {
          const item = row.original
                    const dateStr = formatISTDate(item.dispatch_date)

          return (
            <div
              key={item.id}
              onClick={() => onViewDetail(item)}
              className="bg-white rounded-xl p-4 shadow-xs border border-[#E5E7EB] space-y-3 cursor-pointer hover:border-zinc-300 transition-colors"
            >
              {/* Header: Date + DB No + Status */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-zinc-900">
                    {dateStr}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                    {item.dispatch_bill_number}
                  </span>
                </div>

                <div>
                  {item.status === 'dispatched' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      Dispatched
                    </span>
                  ) : item.status === 'draft' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Draft
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              {/* Party & Lorry Plate */}
              <div>
                <h4 className="text-sm font-bold text-zinc-900">
                  {item.parties?.party_name || item.party_id}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-600">
                  <span className="font-medium text-zinc-800">
                    {item.qualities?.quality_name || item.quality_id}
                  </span>
                  <span>•</span>
                  <span className="font-mono font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200 px-1.5 py-0.2 rounded text-[11px]">
                    {item.lorry_number}
                  </span>
                </div>
              </div>

              {/* Weight & Transporter Grid */}
              <div className="grid grid-cols-2 gap-2 bg-[#F8F9FA] p-2.5 rounded-lg border border-[#F0F1F3] text-xs">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                    Billed Tonnage
                  </span>
                  <span className="font-mono font-bold text-zinc-900 text-sm">
                    {item.bill_weight.toFixed(3)} MT
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                    Purchase Bill
                  </span>
                  <span className="font-mono font-medium text-zinc-600">
                    {item.bill_number || '—'}
                  </span>
                </div>

                <div className="col-span-2 pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                    Transporter
                  </span>
                  <span className="italic text-zinc-700 truncate block">
                    {item.transporter}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div
                className="flex items-center justify-end gap-2 pt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onViewDetail(item)}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-slate-50 text-slate-600"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>

                {canEdit && (
                  <Link
                    to={`/dispatch/edit/${item.id}`}
                    className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                    title="Edit Dispatch"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => onDeleteDispatch(item)}
                    className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                    title="Delete Dispatch"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. PAGINATION FOOTER */}
      <div className="px-4 sm:px-6 py-3 bg-white rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600 select-none shadow-2xs">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-2 py-0.5 rounded-md border border-[#E5E7EB] bg-white font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-black/10 cursor-pointer shadow-2xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-zinc-300">|</span>
          <span>
            Showing <strong className="font-mono text-zinc-900">{currentPageRows.length}</strong> of{' '}
            <strong className="font-mono text-zinc-900">{data.length}</strong> dispatches
          </span>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-center">
          <button
            type="button"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-zinc-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-zinc-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <span className="px-2 text-xs font-medium text-zinc-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-zinc-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-zinc-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DispatchTable
