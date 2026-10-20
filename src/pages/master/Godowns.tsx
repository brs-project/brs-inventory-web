import { useState, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Warehouse,
  CheckCircle2,
  XCircle,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Phone,
  User,
  MapPin,
  Scale,
} from 'lucide-react'
import { PageHeader } from '@components/ui/PageHeader'
import { MasterDataTable } from '@components/master/MasterDataTable'
import { GodownFormModal } from '@components/master/GodownFormModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import { useGodowns } from '@hooks/useMasterData'
import { useAuth } from '@hooks/useAuth'
import { cn } from '@lib/utils'
import type { Godown } from '@types'

export function Godowns() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const {
    godowns,
    stats,
    isLoading,
    getNextGodownCode,
    createGodown,
    updateGodown,
    deleteGodown,
    toggleGodownStatus,
  } = useGodowns()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingGodown, setEditingGodown] = useState<Godown | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingGodown, setDeletingGodown] = useState<Godown | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredData = useMemo(() => {
    return godowns.filter((g) => {
      if (statusFilter === 'active' && !g.is_active) return false
      if (statusFilter === 'inactive' && g.is_active) return false

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim()
        const matchName = g.godown_name.toLowerCase().includes(query)
        const matchCode = g.godown_code.toLowerCase().includes(query)
        const matchIncharge = g.incharge_name ? g.incharge_name.toLowerCase().includes(query) : false
        const matchPhone = g.phone ? g.phone.includes(query) : false
        const matchAddress = g.address ? g.address.toLowerCase().includes(query) : false
        return matchName || matchCode || matchIncharge || matchPhone || matchAddress
      }

      return true
    })
  }, [godowns, searchQuery, statusFilter])

  const handleOpenCreate = () => {
    setEditingGodown(null)
    setFormModalOpen(true)
  }

  const handleOpenEdit = (godown: Godown) => {
    setEditingGodown(godown)
    setFormModalOpen(true)
  }

  const handleOpenDelete = (godown: Godown) => {
    setDeletingGodown(godown)
    setDeleteDialogOpen(true)
  }

  const handleSaveGodown = async (data: Omit<Godown, 'id' | 'created_at'>) => {
    if (editingGodown) {
      await updateGodown(editingGodown.id, data)
    } else {
      await createGodown(data)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingGodown) return
    setIsDeleting(true)
    try {
      await deleteGodown(deletingGodown.id)
      setDeleteDialogOpen(false)
      setDeletingGodown(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Get simulated utilization percentage based on godown id
  const getGodownUtilization = (godown: Godown): number => {
    // Generate deterministic simulated occupancy for realistic master display
    const seed = godown.godown_code.charCodeAt(godown.godown_code.length - 1) || 5
    const percentage = ((seed * 17) % 65) + 25 // 25% to 90%
    return percentage
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage > 85) return { bar: 'bg-red-500', text: 'text-red-700 bg-red-50' }
    if (percentage > 65) return { bar: 'bg-amber-500', text: 'text-amber-700 bg-amber-50' }
    return { bar: 'bg-emerald-500', text: 'text-emerald-700 bg-emerald-50' }
  }

  const columns = useMemo<ColumnDef<Godown>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => (
          <span className="text-slate-400 font-mono text-xs">{row.index + 1}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'godown_code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-xs border border-slate-200">
            {row.original.godown_code}
          </span>
        ),
      },
      {
        accessorKey: 'godown_name',
        header: 'Godown / Yard Name',
        cell: ({ row }) => (
          <div>
            <button
              type="button"
              onClick={() => handleOpenEdit(row.original)}
              className="text-left font-bold text-blue-600 hover:text-blue-800 hover:underline transition cursor-pointer block"
            >
              {row.original.godown_name}
            </button>
            {row.original.address && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-xs">
                <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                {row.original.address}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'incharge_name',
        header: 'Supervisor / Incharge',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>{row.original.incharge_name || '—'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Contact Phone',
        cell: ({ row }) => {
          const phone = row.original.phone
          if (!phone) return <span className="text-xs text-slate-400">—</span>
          return (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1 font-mono text-xs text-slate-700 hover:text-blue-600 hover:underline transition"
            >
              <Phone className="h-3 w-3 text-slate-400" />
              <span>{phone}</span>
            </a>
          )
        },
      },
      {
        accessorKey: 'capacity_mt',
        header: 'Capacity (MT)',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-800">
            <Scale className="h-3.5 w-3.5 text-slate-400" />
            <span>{row.original.capacity_mt?.toLocaleString() || '—'} MT</span>
          </div>
        ),
      },
      {
        id: 'utilization',
        header: 'Utilization',
        cell: ({ row }) => {
          const utilization = getGodownUtilization(row.original)
          const colors = getUtilizationColor(utilization)
          const capacity = row.original.capacity_mt || 1000
          const occupied = ((capacity * utilization) / 100).toFixed(0)

          return (
            <div className="w-36 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-500">
                  {occupied} / {capacity} MT
                </span>
                <span className={cn('px-1.5 py-0.2 rounded font-bold font-mono text-[10px]', colors.text)}>
                  {utilization}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className={cn('h-full rounded-full transition-all duration-300', colors.bar)}
                  style={{ width: `${utilization}%` }}
                />
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.is_active
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                isActive
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              )}
            >
              <span
                className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-green-600' : 'bg-red-600')}
              />
              {isActive ? 'Active' : 'Inactive'}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleOpenEdit(item)}
                title="Edit Godown"
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => toggleGodownStatus(item.id)}
                title={item.is_active ? 'Deactivate' : 'Activate'}
                className={cn(
                  'p-1.5 rounded-lg transition cursor-pointer',
                  item.is_active
                    ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    : 'text-green-600 hover:bg-green-50'
                )}
              >
                {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenDelete(item)}
                  title="Delete Godown"
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [isAdmin, toggleGodownStatus]
  )

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Godowns &amp; Storage Locations"
        subtitle="Manage warehouses, scrap dumping yards, bay capacities, and supervisor assignments."
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Godowns
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
                {stats.total}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
            Locations
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50 text-green-600 border border-green-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Operational Units
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-green-600 font-sans">
                {stats.active}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">
            Accepting Stock
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Suspended / Closed
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-red-600 font-sans">
                {stats.inactive}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-lg">
            Locked
          </span>
        </div>
      </div>

      {/* Table */}
      <MasterDataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        searchPlaceholder="Search godown name, code, incharge, address..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAdd={handleOpenCreate}
        addButtonLabel="Add Godown"
        emptyTitle="No godowns found"
        emptyDescription="There are no storage facilities matching your filter. Add a new godown or yard to enable stock tracking."
      />

      {/* Modals */}
      <GodownFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        godown={editingGodown}
        onSave={handleSaveGodown}
        nextCode={getNextGodownCode()}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingGodown?.godown_name || 'Godown'}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default Godowns
