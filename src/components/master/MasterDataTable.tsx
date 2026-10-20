import React, { useState, useEffect, useRef } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Search,
  Plus,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Inbox,
  X,
} from 'lucide-react'
import { cn } from '@lib/utils'

export interface MasterDataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  isLoading?: boolean
  searchPlaceholder?: string
  onAdd?: () => void
  addButtonLabel?: string
  onExport?: () => void
  exportButtonLabel?: string
  searchQuery?: string
  onSearchChange?: (value: string) => void
  statusFilter?: 'all' | 'active' | 'inactive'
  onStatusFilterChange?: (status: 'all' | 'active' | 'inactive') => void
  statusCounts?: {
    all: number
    active: number
    inactive: number
  }
  emptyTitle?: string
  emptyDescription?: string
  rightActions?: React.ReactNode
  pageSizeOptions?: number[]
  initialPageSize?: number
  renderMobileCard?: (item: TData) => React.ReactNode
}

export function MasterDataTable<TData>({
  columns,
  data,
  isLoading,
  searchPlaceholder = 'Search records...',
  onAdd,
  addButtonLabel = 'Add Record',
  onExport,
  exportButtonLabel = 'Export',
  searchQuery = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  statusCounts,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your search criteria. Add a new record or reset filters to get started.',
  rightActions,
  pageSizeOptions = [10, 25, 50],
  initialPageSize = 10,
  renderMobileCard,
}: MasterDataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Pressing '/' or 'Cmd+K' / 'Ctrl+K' focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (document.activeElement?.tagName || '')
        )
      ) {
        return
      }

      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // TanStack Table Instance
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // Pagination bounds
  const totalRows = data.length
  const startRow = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const endRow = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)

  const isFiltered = searchQuery !== '' || statusFilter !== 'all'

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden select-none flex flex-col transition-all">
      {/* =========================================================================
          CONTROLS TOOLBAR: Search, Status Tabs, Actions
      ========================================================================= */}
      <div className="p-3 sm:p-4 border-b border-zinc-200/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
        {/* Left Side: Search + Segmented Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
          {/* Sleek Search Box with Keyboard Hint */}
          <div className="relative flex-1 min-w-[220px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-14 py-2 bg-zinc-50/70 hover:bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 rounded-lg transition-all focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange && onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600 transition"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <kbd className="text-[10px] font-mono font-medium text-zinc-400 bg-white border border-zinc-200 px-1.5 py-0.5 rounded shadow-2xs">
                  /
                </kbd>
              </div>
            )}
          </div>

          {/* Status Segmented Control Tabs */}
          {onStatusFilterChange && (
            <div className="bg-zinc-100/90 p-1 rounded-lg border border-zinc-200/70 inline-flex items-center gap-1 shrink-0 select-none">
              {(
                [
                  { id: 'all', label: 'All', count: statusCounts?.all },
                  { id: 'active', label: 'Active', count: statusCounts?.active },
                  { id: 'inactive', label: 'Inactive', count: statusCounts?.inactive },
                ] as const
              ).map((tab) => {
                const isActive = statusFilter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onStatusFilterChange(tab.id)}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer',
                      isActive
                        ? 'bg-white text-zinc-900 font-semibold shadow-2xs border border-zinc-200/70'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/40'
                    )}
                  >
                    <span>{tab.label}</span>
                    {typeof tab.count === 'number' && (
                      <span
                        className={cn(
                          'text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full',
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : 'bg-zinc-200/70 text-zinc-500'
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Side: Export + Add CTAs */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          {rightActions}

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-medium shadow-2xs transition hover:text-zinc-900 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" />
              <span>{exportButtonLabel}</span>
            </button>
          )}

          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-medium shadow-xs shadow-indigo-600/20 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{addButtonLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW: Stacked Cards
      ========================================================================= */}
      {renderMobileCard && (
        <div className="block sm:hidden divide-y divide-zinc-100/90 p-3 space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-zinc-50 animate-pulse space-y-3">
                <div className="h-5 bg-zinc-200/80 rounded w-1/2" />
                <div className="h-4 bg-zinc-200/60 rounded w-3/4" />
                <div className="h-4 bg-zinc-200/60 rounded w-1/3" />
              </div>
            ))
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => renderMobileCard(row.original))
          ) : (
            <div className="py-12 text-center">
              <div className="h-10 w-10 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto mb-2.5">
                <Inbox className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-1">{emptyTitle}</h3>
              <p className="text-xs text-zinc-500 mb-4">{emptyDescription}</p>
              {isFiltered ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onSearchChange) onSearchChange('')
                    if (onStatusFilterChange) onStatusFilterChange('all')
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 transition"
                >
                  Reset Filters
                </button>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          DESKTOP VIEW: High-Density Table with Sticky Header
      ========================================================================= */}
      <div className={cn('overflow-x-auto flex-1', renderMobileCard ? 'hidden sm:block' : 'block')}>
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-zinc-50/90 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10 backdrop-blur-xs"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sortDirection = header.column.getIsSorted()

                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'py-3 px-4 font-semibold select-none text-zinc-500',
                        canSort ? 'cursor-pointer hover:bg-zinc-100/80 transition' : ''
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-zinc-400">
                            {sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                            ) : sortDirection === 'desc' ? (
                              <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 opacity-30 hover:opacity-100" />
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

          <tbody className="divide-y divide-zinc-100/90">
            {isLoading ? (
              // SKELETON LOADING ROWS
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-3.5 px-4">
                      <div className="h-4 bg-zinc-200/70 rounded-md w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              // RENDER DATA ROWS
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-zinc-50/90 transition-colors duration-150 group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4 text-zinc-700">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // EMPTY STATE ROW
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="h-11 w-11 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3 shadow-2xs">
                      <Inbox className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 mb-1">{emptyTitle}</h3>
                    <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                      {emptyDescription}
                    </p>
                    {isFiltered ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSearchChange) onSearchChange('')
                          if (onStatusFilterChange) onStatusFilterChange('all')
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-800 bg-zinc-100 hover:bg-zinc-200/80 border border-zinc-200 transition cursor-pointer"
                      >
                        Reset Search Filters
                      </button>
                    ) : onAdd ? (
                      <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-600/20 transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{addButtonLabel}</span>
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          PAGINATION BAR: High-Density Row Counts & Controls
      ========================================================================= */}
      <div className="px-4 py-3 border-t border-zinc-200/70 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="font-semibold text-zinc-800 font-mono">{startRow}</strong>–
            <strong className="font-semibold text-zinc-800 font-mono">{endRow}</strong> of{' '}
            <strong className="font-semibold text-zinc-800 font-mono">{totalRows}</strong> records
          </span>

          <span className="text-zinc-300">│</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400">Rows:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
              className="px-2 py-0.5 bg-white border border-zinc-200 rounded text-xs font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 bg-white text-zinc-700 font-medium hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-2 font-medium text-zinc-600">
            Page {table.getPageCount() === 0 ? 0 : pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </span>

          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 bg-white text-zinc-700 font-medium hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MasterDataTable
