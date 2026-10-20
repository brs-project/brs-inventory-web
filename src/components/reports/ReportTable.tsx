import React, { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Inbox,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { cn } from '@lib/utils'

export interface ReportColumn<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  width?: string
  render?: (row: T, index: number) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface ReportTotalsCell {
  key: string
  content: React.ReactNode
  align?: 'left' | 'center' | 'right'
  colSpan?: number
  className?: string
}

export interface ReportTableProps<T> {
  columns: ReportColumn<T>[]
  data: T[]
  isLoading?: boolean
  totals?: ReportTotalsCell[]
  renderSubRow?: (row: T) => React.ReactNode
  isRowExpandable?: (row: T) => boolean
  rowKey?: (row: T, index: number) => string | number
  emptyMessage?: string
  className?: string
}

export function ReportTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  totals,
  renderSubRow,
  isRowExpandable,
  rowKey,
  emptyMessage = 'No matching records found for the selected criteria.',
  className,
}: ReportTableProps<T>) {
  const [expandedRowKeys, setExpandedRowKeys] = useState<Set<string | number>>(new Set())
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const toggleRow = (key: string | number) => {
    setExpandedRowKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortKey(null)
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  // Sorted data if sortKey is set
  const sortedData = React.useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]

      if (valA === valB) return 0
      if (valA === undefined || valA === null) return 1
      if (valB === undefined || valB === null) return -1

      let comparison = 0
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB
      } else {
        comparison = String(valA).localeCompare(String(valB))
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection])

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col',
        className
      )}
    >
      <div className="overflow-x-auto overflow-y-auto max-h-[750px] relative scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md text-slate-700 font-bold border-b border-slate-200 shadow-2xs">
            <tr>
              {renderSubRow && (
                <th scope="col" className="w-8 px-3 py-3 text-center">
                  <span className="sr-only">Expand</span>
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortKey === col.key
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left'

                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={cn(
                      'px-3.5 py-3 whitespace-nowrap uppercase text-[11px] tracking-wider text-slate-600 select-none',
                      alignClass,
                      col.sortable && 'cursor-pointer hover:bg-slate-200/70 transition',
                      col.className
                    )}
                  >
                    <div
                      className={cn(
                        'inline-flex items-center gap-1',
                        col.align === 'right' && 'justify-end w-full'
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3 w-3 text-blue-600" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-blue-600" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              /* Loading Skeletons */
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {renderSubRow && <td className="py-3.5 px-3" />}
                  {columns.map((_, j) => (
                    <td key={j} className="py-3.5 px-3.5">
                      <div className="h-4 bg-slate-100 rounded-md" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length > 0 ? (
              sortedData.map((row, index) => {
                const key = rowKey ? rowKey(row, index) : index
                const isExpanded = expandedRowKeys.has(key)
                const expandable = isRowExpandable ? isRowExpandable(row) : Boolean(renderSubRow)
                const isEven = index % 2 === 1

                return (
                  <React.Fragment key={key}>
                    <tr
                      className={cn(
                        'transition-colors duration-100 hover:bg-blue-50/60',
                        isEven ? 'bg-slate-50/40' : 'bg-white',
                        isExpanded && 'bg-blue-50/40 font-medium'
                      )}
                    >
                      {renderSubRow && (
                        <td className="px-3 py-3 text-center text-slate-400">
                          {expandable ? (
                            <button
                              type="button"
                              onClick={() => toggleRow(key)}
                              className="p-1 rounded-md hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                              title={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>
                          ) : null}
                        </td>
                      )}

                      {columns.map((col) => {
                        const alignClass =
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'

                        const cellValue = col.render ? col.render(row, index) : row[col.key]

                        return (
                          <td
                            key={col.key}
                            className={cn(
                              'px-3.5 py-3 whitespace-nowrap text-slate-700',
                              alignClass,
                              col.className
                            )}
                          >
                            {cellValue !== undefined && cellValue !== null ? cellValue : '—'}
                          </td>
                        )
                      })}
                    </tr>

                    {/* Sub Row Content */}
                    {isExpanded && renderSubRow && (
                      <tr className="bg-slate-50/90 border-y border-slate-200/80">
                        <td
                          colSpan={columns.length + 1}
                          className="px-6 py-4 animate-in fade-in-50 duration-150"
                        >
                          {renderSubRow(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            ) : (
              /* Empty State */
              <tr>
                <td
                  colSpan={columns.length + (renderSubRow !== undefined ? 1 : 0)}
                  className="py-16 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                      <Inbox className="h-7 w-7" />
                    </div>
                    <p className="font-bold text-slate-800 text-sm">No Records Found</p>
                    <p className="text-xs text-slate-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>

          {/* Totals Footer Row */}
          {totals && totals.length > 0 && !isLoading && sortedData.length > 0 && (
            <tfoot className="sticky bottom-0 z-20 bg-slate-900 text-white font-bold border-t-2 border-slate-800 shadow-lg">
              <tr>
                {renderSubRow && <td className="px-3 py-3" />}
                {totals.map((tCell, idx) => {
                  const alignClass =
                    tCell.align === 'right'
                      ? 'text-right'
                      : tCell.align === 'center'
                      ? 'text-center'
                      : 'text-left'

                  return (
                    <td
                      key={tCell.key || idx}
                      colSpan={tCell.colSpan || 1}
                      className={cn(
                        'px-3.5 py-3 whitespace-nowrap text-xs text-white',
                        alignClass,
                        tCell.className
                      )}
                    >
                      {tCell.content}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

export default ReportTable
