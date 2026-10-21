import { useState, useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Truck,
  CheckCircle2,
  XCircle,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Phone,
  User,
  Scale,
  Building2,
} from 'lucide-react'
import { PageHeader } from '@components/ui/PageHeader'
import { MasterDataTable } from '@components/master/MasterDataTable'
import { VehicleFormModal } from '@components/master/VehicleFormModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import { useVehicles } from '@hooks/useMasterData'
import { useAuth } from '@hooks/useAuth'
import { cn } from '@lib/utils'
import type { Vehicle } from '@types'

export function Vehicles() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const {
    vehicles,
    stats,
    isLoading,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleStatus,
  } = useVehicles()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredData = useMemo(() => {
    return vehicles.filter((v) => {
      if (statusFilter === 'active' && !v.is_active) return false
      if (statusFilter === 'inactive' && v.is_active) return false

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim()
        const matchLorry = v.lorry_number.toLowerCase().includes(query)
        const matchOwner = v.owner_name ? v.owner_name.toLowerCase().includes(query) : false
        const matchType = v.vehicle_type ? v.vehicle_type.toLowerCase().includes(query) : false
        const matchDriver = v.driver_name ? v.driver_name.toLowerCase().includes(query) : false
        const matchPhone = v.driver_phone ? v.driver_phone.includes(query) : false
        return matchLorry || matchOwner || matchType || matchDriver || matchPhone
      }

      return true
    })
  }, [vehicles, searchQuery, statusFilter])

  const handleOpenCreate = () => {
    setEditingVehicle(null)
    setFormModalOpen(true)
  }

  const handleOpenEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormModalOpen(true)
  }

  const handleOpenDelete = (vehicle: Vehicle) => {
    setDeletingVehicle(vehicle)
    setDeleteDialogOpen(true)
  }

  const handleSaveVehicle = async (data: Omit<Vehicle, 'id' | 'created_at'>) => {
    if (editingVehicle) {
      await updateVehicle(editingVehicle.id, data)
    } else {
      await createVehicle(data)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingVehicle) return
    setIsDeleting(true)
    try {
      await deleteVehicle(deletingVehicle.id)
      setDeleteDialogOpen(false)
      setDeletingVehicle(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const getVehicleTypeBadgeStyle = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'heavy':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'light':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'container':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  const columns = useMemo<ColumnDef<Vehicle>[]>(
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
        accessorKey: 'lorry_number',
        header: 'Lorry / Reg Number',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              <Truck className="h-3.5 w-3.5" />
            </div>
            <button
              type="button"
              onClick={() => handleOpenEdit(row.original)}
              className="text-left font-mono font-bold text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline transition cursor-pointer tracking-wider"
            >
              {row.original.lorry_number}
            </button>
          </div>
        ),
      },
      {
        accessorKey: 'vehicle_type',
        header: 'Type',
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
              getVehicleTypeBadgeStyle(row.original.vehicle_type)
            )}
          >
            {row.original.vehicle_type || 'Standard'}
          </span>
        ),
      },
      {
        accessorKey: 'owner_name',
        header: 'Transport Agency / Owner',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[180px]">{row.original.owner_name || 'Self / Own Fleet'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'capacity_mt',
        header: 'Capacity (MT)',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 font-mono font-bold text-xs text-slate-800">
            <Scale className="h-3.5 w-3.5 text-slate-400" />
            <span>{row.original.capacity_mt ? `${row.original.capacity_mt} MT` : '—'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'driver_name',
        header: 'Driver Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{row.original.driver_name || '—'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'driver_phone',
        header: 'Driver Phone',
        cell: ({ row }) => {
          const phone = row.original.driver_phone
          if (!phone) return <span className="text-xs text-slate-400">—</span>
          return (
            <a
              href={`tel:${phone}`}
              className="inline-flex items-center gap-1 font-mono text-xs text-slate-700 hover:text-blue-600 hover:underline transition"
            >
              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{phone}</span>
            </a>
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
                title="Edit Vehicle"
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => toggleVehicleStatus(item.id)}
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
                  title="Delete Vehicle"
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
    [isAdmin, toggleVehicleStatus]
  )

  return (
    <div className="space-y-6 select-none">
      <PageHeader
        title="Vehicles &amp; Transport Fleet"
        subtitle="Manage trucks, lorries, tare weights, payload limits, and driver contact records."
      />

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Fleet
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-sans">
                {stats.total}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
            Registered
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50 text-green-600 border border-green-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active in Logistics
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-green-600 font-sans">
                {stats.active}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">
            Gate Pass OK
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Inactive / Suspended
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-red-600 font-sans">
                {stats.inactive}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-lg">
            Restricted
          </span>
        </div>
      </div>

      {/* Table */}
      <MasterDataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        searchPlaceholder="Search lorry plate, owner, vehicle type, driver, phone..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAdd={handleOpenCreate}
        addButtonLabel="Add Vehicle"
        emptyTitle="No vehicles found"
        emptyDescription="There are no registered lorries or trucks matching your filter. Add a new vehicle to register gate movements."
      />

      {/* Modals */}
      <VehicleFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        vehicle={editingVehicle}
        onSave={handleSaveVehicle}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingVehicle?.lorry_number || 'Vehicle'}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export { Vehicles as Transports }
export default Vehicles
