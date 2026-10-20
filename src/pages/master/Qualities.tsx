import { formatISTDateTime } from '@lib/dateUtils'
import { useState, useMemo, useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  FileText,
  Tag,
  Award,
} from 'lucide-react'
import { MasterDataTable } from '@components/master/MasterDataTable'
import { QualityFormModal } from '@components/master/QualityFormModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import { SkeletonTable } from '@components/ui/Skeleton'
import { useQualities } from '@hooks/useMasterData'
import { useAuth } from '@hooks/useAuth'
import { exportToCSV } from '@lib/exportCSV'
import { cn } from '@lib/utils'
import type { Quality } from '@types'

export function Qualities() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const {
    qualities,
    stats,
    isLoading,
    getNextQualityCode,
    createQuality,
    updateQuality,
    deleteQuality,
    toggleQualityStatus,
  } = useQualities()

  // Local state for search, filters, modals
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingQuality, setEditingQuality] = useState<Quality | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingQuality, setDeletingQuality] = useState<Quality | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtered dataset
  const filteredData = useMemo(() => {
    return qualities.filter((q) => {
      if (statusFilter === 'active' && !q.is_active) return false
      if (statusFilter === 'inactive' && q.is_active) return false

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim()
        const matchName = q.quality_name.toLowerCase().includes(query)
        const matchCode = q.quality_code.toLowerCase().includes(query)
        const matchCategory = q.category ? q.category.toLowerCase().includes(query) : false
        const matchHsn = q.hsn_code ? q.hsn_code.toLowerCase().includes(query) : false
        const matchDesc = q.description ? q.description.toLowerCase().includes(query) : false
        return matchName || matchCode || matchCategory || matchHsn || matchDesc
      }

      return true
    })
  }, [qualities, searchQuery, statusFilter])

  // Open Form Modal for Create
  const handleOpenCreate = useCallback(() => {
    setEditingQuality(null)
    setFormModalOpen(true)
  }, [])

  // Open Form Modal for Edit
  const handleOpenEdit = useCallback((quality: Quality) => {
    setEditingQuality(quality)
    setFormModalOpen(true)
  }, [])

  // Open Delete Confirmation
  const handleOpenDelete = useCallback((quality: Quality) => {
    setDeletingQuality(quality)
    setDeleteDialogOpen(true)
  }, [])

  // Handle Save (Create or Update)
  const handleSaveQuality = async (data: Omit<Quality, 'id' | 'created_at'>) => {
    if (editingQuality) {
      await updateQuality(editingQuality.id, data)
    } else {
      await createQuality(data)
    }
  }

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingQuality) return
    setIsDeleting(true)
    try {
      await deleteQuality(deletingQuality.id)
      setDeleteDialogOpen(false)
      setDeletingQuality(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle Export CSV
  const handleExportCSV = useCallback(() => {
    const exportHeaders = [
      { key: 'quality_code', label: 'Quality Code' },
      { key: 'quality_name', label: 'Quality Name' },
      { key: 'category', label: 'Category' },
      { key: 'unit_of_measure', label: 'UOM' },
      { key: 'hsn_code', label: 'HSN Code' },
      { key: 'description', label: 'Description' },
      { key: 'is_active', label: 'Is Active' },
    ]
    exportToCSV(filteredData, 'qualities_master', exportHeaders)
  }, [filteredData])

  // Category subtle pill styling
  const getCategoryBadgeStyle = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'scrap':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200/80'
      case 'heavy':
        return 'bg-amber-50 text-amber-800 border-amber-200/70'
      case 'processed':
        return 'bg-purple-50 text-purple-800 border-purple-200/70'
      case 'primary':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/70'
      case 'other':
      default:
        return 'bg-zinc-50 text-zinc-600 border-zinc-200/60'
    }
  }

  // High-Density Column Definitions
  const columns = useMemo<ColumnDef<Quality>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => (
          <span className="text-zinc-400 font-mono text-xs">{row.index + 1}</span>
        ),
        enableSorting: false,
        size: 40,
      },
      {
        accessorKey: 'quality_code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-mono font-bold text-xs border border-zinc-200/70">
            {row.original.quality_code}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: 'quality_name',
        header: 'Quality & Specification',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => handleOpenEdit(row.original)}
              className="text-left font-semibold text-[13px] text-zinc-900 hover:text-zinc-600 transition-colors cursor-pointer block leading-tight"
            >
              {row.original.quality_name}
            </button>
            {row.original.description && (
              <p
                className="text-xs text-zinc-400 truncate max-w-xs"
                title={row.original.description}
              >
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
              getCategoryBadgeStyle(row.original.category)
            )}
          >
            <Tag className="h-3 w-3 shrink-0 opacity-60" />
            <span>{row.original.category || 'Standard'}</span>
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'unit_of_measure',
        header: 'UOM & HSN',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="inline-block font-mono text-xs font-semibold text-zinc-700 bg-zinc-100/80 px-2 py-0.5 rounded border border-zinc-200/70">
              {row.original.unit_of_measure}
            </div>
            {row.original.hsn_code && (
              <div className="flex items-center gap-1 font-mono text-xs text-zinc-500">
                <FileText className="h-3 w-3 text-zinc-400 shrink-0" />
                <span>HSN: {row.original.hsn_code}</span>
              </div>
            )}
          </div>
        ),
        size: 130,
      },
      {
        accessorKey: 'created_at',
        header: 'Created (IST)',
        cell: ({ row }) => (
          <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">
            {formatISTDateTime(row.original.created_at)}
          </span>
        ),
        size: 140,
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.is_active
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200/80'
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full shrink-0',
                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                )}
              />
              <span>{isActive ? 'Active' : 'Inactive'}</span>
            </span>
          )
        },
        size: 100,
      },
      {
        id: 'rate_and_stock',
        header: 'Default Rate & Stock',
        cell: ({ row }) => {
          const item = row.original as any
          const rate = item.default_rate_per_kg ?? item.defaultRatePerKg
          const stockMt = item.current_stock_mt ?? item.currentStockMt ?? 0
          return (
            <div className="space-y-0.5">
              <div className="text-[13px] font-mono font-semibold text-zinc-900 leading-tight">
                {rate !== undefined ? `₹${Number(rate).toFixed(2)}/kg` : '—'}
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                Stock: <span className="font-semibold text-zinc-800">{Number(stockMt).toFixed(3)} MT</span>
              </div>
            </div>
          )
        },
        size: 150,
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 90,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {/* Edit Ghost Button */}
              <button
                type="button"
                onClick={() => handleOpenEdit(item)}
                title="Edit Quality"
                className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              {/* Toggle Status Ghost Button */}
              <button
                type="button"
                onClick={() => toggleQualityStatus(item.id)}
                title={item.is_active ? 'Deactivate Grade' : 'Activate Grade'}
                className={cn(
                  'p-1.5 rounded-md hover:bg-zinc-100 transition-colors cursor-pointer',
                  item.is_active
                    ? 'text-zinc-400 hover:text-zinc-900'
                    : 'text-emerald-600 hover:text-emerald-700'
                )}
              >
                {item.is_active ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
              </button>

              {/* Delete Ghost Button (Admin only) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenDelete(item)}
                  title="Delete Quality"
                  className="p-1.5 rounded-md hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [isAdmin, handleOpenEdit, handleOpenDelete, toggleQualityStatus]
  )

  return (
    <div className="space-y-4 select-none pb-12">
      {/* =========================================================================
          SINGLE-ROW CLEAN HEADER & MICRO-KPI STRIP
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-800 border border-zinc-200/80">
              <Award className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <span>Qualities &amp; Commodities</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                {stats.total}
              </span>
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            Configure scrap grades, technical specifications, and HSN tariff codes.
          </p>
        </div>

        {/* Micro-KPI Segmented Strip */}
        <div className="bg-zinc-100/80 px-3 py-1.5 rounded-lg border border-zinc-200/70 inline-flex items-center gap-3 text-xs font-medium text-zinc-600 shrink-0 self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-900 font-mono">{stats.total}</span>
            <span className="text-zinc-500">Total</span>
          </div>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold text-zinc-900 font-mono">{stats.active}</span>
            <span className="text-zinc-500">Active</span>
          </div>
          <span className="text-zinc-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <span className="font-semibold text-zinc-900 font-mono">{stats.inactive}</span>
            <span className="text-zinc-500">Suspended</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          HIGH-DENSITY MODERN DATA TABLE
      ========================================================================= */}
      {isLoading && filteredData.length === 0 ? (
        <SkeletonTable rows={4} cols={6} />
      ) : (
        <MasterDataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        searchPlaceholder="Search quality name, code, category, HSN... (/)"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusCounts={{
          all: stats.total,
          active: stats.active,
          inactive: stats.inactive,
        }}
        onAdd={handleOpenCreate}
        addButtonLabel="Add Quality"
        onExport={handleExportCSV}
        exportButtonLabel="Export CSV"
        emptyTitle="No quality grades found"
        emptyDescription="There are no scrap grades matching your search or status criteria. Configure a new commodity quality to begin trading."
      />
      )}

      {/* =========================================================================
          MODALS: Add/Edit & Delete
      ========================================================================= */}
      <QualityFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        quality={editingQuality}
        onSave={handleSaveQuality}
        nextCode={getNextQualityCode()}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingQuality?.quality_name || 'Quality Grade'}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default Qualities

export { Qualities as QualityGrades }
