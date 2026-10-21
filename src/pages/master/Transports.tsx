import { useState, useMemo, useEffect, useCallback } from 'react'
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
  IndianRupee,
  MapPin,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@components/ui/PageHeader'
import { MasterDataTable } from '@components/master/MasterDataTable'
import { TransportFormModal } from '@components/master/TransportFormModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import {
  fetchTransports,
  createTransport,
  updateTransport,
  deleteTransport,
  toggleTransportStatus,
  type TransportWithParty,
  type CreateTransportInput,
} from '@/services/transportService'
import { useAuth } from '@hooks/useAuth'
import { cn } from '@lib/utils'

export function Transports() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [transports, setTransports] = useState<TransportWithParty[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingTransport, setEditingTransport] = useState<TransportWithParty | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTransport, setDeletingTransport] = useState<TransportWithParty | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch transport fleet from public.transports
  const loadTransports = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchTransports()
      setTransports(data)
    } catch (err: any) {
      console.error('Failed to load transports:', err)
      toast.error(err?.message || 'Failed to load transports fleet')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransports()
  }, [loadTransports])

  // Filtered dataset
  const filteredData = useMemo(() => {
    return transports.filter((t) => {
      // Status filtering
      if (statusFilter === 'active' && !t.is_active) return false
      if (statusFilter === 'inactive' && t.is_active) return false

      // Text search
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const vehicleNum = (t.vehicle_number || '').toLowerCase()
      const transporter = (t.transporter_name || t.parties?.name || '').toLowerCase()
      const driver = (t.driver_name || '').toLowerCase()
      const phone = (t.driver_phone || '').toLowerCase()
      const route = (t.default_route || '').toLowerCase()
      const material = (t.material_type || '').toLowerCase()

      return (
        vehicleNum.includes(q) ||
        transporter.includes(q) ||
        driver.includes(q) ||
        phone.includes(q) ||
        route.includes(q) ||
        material.includes(q)
      )
    })
  }, [transports, statusFilter, searchQuery])

  // Fleet Statistics
  const stats = useMemo(() => {
    const total = transports.length
    const active = transports.filter((t) => t.is_active).length
    const inactive = total - active
    const uniqueTransporters = new Set(
      transports.map((t) => t.transporter_name || t.parties?.name).filter(Boolean)
    ).size

    return { total, active, inactive, uniqueTransporters }
  }, [transports])

  // Handlers
  const handleOpenCreate = () => {
    setEditingTransport(null)
    setFormModalOpen(true)
  }

  const handleOpenEdit = useCallback((transport: TransportWithParty) => {
    setEditingTransport(transport)
    setFormModalOpen(true)
  }, [])

  const handleSaveTransport = async (payload: CreateTransportInput) => {
    try {
      if (editingTransport) {
        await updateTransport(editingTransport.id, payload)
        toast.success('Transport ' + payload.vehicle_number + ' updated successfully')
      } else {
        await createTransport(payload)
        toast.success('Transport ' + payload.vehicle_number + ' added to fleet')
      }
      await loadTransports()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save transport vehicle')
      throw err
    }
  }

  const handleToggleStatus = useCallback(
    async (transport: TransportWithParty) => {
      const nextStatus = !transport.is_active
      try {
        await toggleTransportStatus(transport.id, nextStatus)
        toast.success(
          'Vehicle ' + transport.vehicle_number + ' ' + (nextStatus ? 'activated' : 'deactivated')
        )
        await loadTransports()
      } catch (err: any) {
        toast.error(err?.message || 'Failed to update vehicle status')
      }
    },
    [loadTransports]
  )

  const handleOpenDelete = useCallback((transport: TransportWithParty) => {
    setDeletingTransport(transport)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!deletingTransport) return
    setIsDeleting(true)
    try {
      await deleteTransport(deletingTransport.id)
      toast.success('Transport ' + deletingTransport.vehicle_number + ' permanently removed')
      setDeleteDialogOpen(false)
      setDeletingTransport(null)
      await loadTransports()
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete transport vehicle')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExportCSV = () => {
    if (transports.length === 0) {
      toast.error('No transport records to export')
      return
    }

    const headers = [
      'Vehicle Number',
      'Transporter Name',
      'Transporter Code',
      'Driver Name',
      'Driver Phone',
      'Tare Weight (MT)',
      'Freight Rate (INR/MT)',
      'Fixed Trip Charge (INR)',
      'Default Route',
      'Material Type',
      'Status',
    ]

    const rows = filteredData.map((t) => [
      t.vehicle_number,
      t.transporter_name || t.parties?.name || 'Self / Direct',
      t.parties?.code || '',
      t.driver_name || '',
      t.driver_phone || '',
      t.default_tare_weight_mt || 0,
      t.default_freight_rate_per_mt || 0,
      t.fixed_trip_charge || 0,
      t.default_route || '',
      t.material_type || '',
      t.is_active ? 'Active' : 'Inactive',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => '"' + String(val).replace(/"/g, '""') + '"').join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'transports_fleet_' + new Date().toISOString().slice(0, 10) + '.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Exported ' + filteredData.length + ' transport records to CSV')
  }

  // TanStack Columns Configuration
  const columns = useMemo<ColumnDef<TransportWithParty>[]>(
    () => [
      {
        accessorKey: 'vehicle_number',
        header: 'Vehicle No',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <span className="font-mono font-bold text-xs sm:text-sm text-zinc-900 tracking-wider">
                {row.original.vehicle_number}
              </span>
              <div className="text-[11px] text-zinc-400 font-mono">
                {row.original.material_type || 'General Fleet'}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'transporter_name',
        header: 'Transporter Name',
        cell: ({ row }) => {
          const item = row.original
          const name = item.transporter_name || item.parties?.name
          const code = item.parties?.code
          return (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span className="truncate max-w-[200px]">{name || 'Self / Own Fleet'}</span>
              </div>
              {code && (
                <span className="inline-block font-mono text-[10px] font-semibold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/80">
                  {code}
                </span>
              )}
            </div>
          )
        },
      },
      {
        id: 'driver_contact',
        header: 'Driver & Contact',
        cell: ({ row }) => {
          const item = row.original
          const name = item.driver_name
          const phone = item.driver_phone
          if (!name && !phone) return <span className="text-xs text-zinc-400">—</span>

          return (
            <div className="space-y-0.5">
              {name && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
                  <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate max-w-[140px]">{name}</span>
                </div>
              )}
              {phone && (
                <a
                  href={'tel:' + phone}
                  className="inline-flex items-center gap-1 font-mono text-xs text-zinc-600 hover:text-blue-600 hover:underline transition"
                >
                  <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                  <span>{phone}</span>
                </a>
              )}
            </div>
          )
        },
      },
      {
        id: 'freight_rate',
        header: 'Freight Rate (₹/MT or Fixed ₹)',
        cell: ({ row }) => {
          const ratePerMt = Number(row.original.default_freight_rate_per_mt ?? 0)
          const fixedCharge = Number(row.original.fixed_trip_charge ?? 0)

          if (ratePerMt === 0 && fixedCharge === 0) {
            return <span className="text-xs text-zinc-400">—</span>
          }

          return (
            <div className="space-y-0.5 font-mono text-xs">
              {ratePerMt > 0 && (
                <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <IndianRupee className="h-3 w-3 text-emerald-500" />
                  <span>{ratePerMt.toFixed(2)}/MT</span>
                </div>
              )}
              {fixedCharge > 0 && (
                <div className="flex items-center gap-1 text-blue-700 font-medium text-[11px]">
                  <IndianRupee className="h-3 w-3 text-blue-500" />
                  <span>{fixedCharge.toFixed(2)} Fix</span>
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'default_tare_weight_mt',
        header: 'Tare Wt (MT)',
        cell: ({ row }) => {
          const tare = Number(row.original.default_tare_weight_mt ?? 0)
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-800">
              <Scale className="h-3.5 w-3.5 text-zinc-400" />
              <span>{tare > 0 ? tare.toFixed(3) + ' MT' : '0.000 MT'}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'default_route',
        header: 'Route',
        cell: ({ row }) => {
          const route = row.original.default_route
          if (!route) return <span className="text-xs text-zinc-400">—</span>
          return (
            <div className="flex items-center gap-1 text-xs text-zinc-700 font-medium">
              <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="truncate max-w-[150px]">{route}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'material_type',
        header: 'Material',
        cell: ({ row }) => {
          const material = row.original.material_type
          if (!material) return <span className="text-xs text-zinc-400">—</span>
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 text-zinc-800 border border-zinc-200/80">
              <Package className="h-3 w-3 text-zinc-400" />
              {material}
            </span>
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
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              {/* Edit Button */}
              <button
                type="button"
                onClick={() => handleOpenEdit(item)}
                title="Edit Transport"
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              {/* Toggle Status Button */}
              <button
                type="button"
                onClick={() => handleToggleStatus(item)}
                title={item.is_active ? 'Deactivate Vehicle' : 'Activate Vehicle'}
                className={cn(
                  'p-1.5 rounded-lg transition cursor-pointer',
                  item.is_active
                    ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                    : 'text-emerald-600 hover:bg-emerald-50'
                )}
              >
                {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>

              {/* Delete Button (Admin only) */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleOpenDelete(item)}
                  title="Delete Transport"
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [isAdmin, handleOpenEdit, handleToggleStatus, handleOpenDelete]
  )

  return (
    <div className="space-y-4 select-none pb-12">
      {/* Top Header */}
      <PageHeader
        title="Transports &amp; Logistics Master"
        subtitle="Manage fleet lorries, transporter contracts, tare weights, freight charges, and driver records."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Total Fleet
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-sans">
                {stats.total}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-lg">
            Registered
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Active in Trips
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-sans">
                {stats.active}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
            Gate OK
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-600 border border-zinc-200">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Suspended / Inactive
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-zinc-700 font-sans">
                {stats.inactive}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-lg">
            Off-duty
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Transporters
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-purple-700 font-sans">
                {stats.uniqueTransporters}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">
            Agencies
          </span>
        </div>
      </div>

      {/* Modern Data Table */}
      <MasterDataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        searchPlaceholder="Search vehicle plate, transporter, driver, phone, route, material..."
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
        addButtonLabel="Add Transport"
        onExport={handleExportCSV}
        exportButtonLabel="Export CSV"
        emptyTitle="No transport vehicles found"
        emptyDescription="There are no registered transport vehicles matching your criteria. Add a vehicle to begin tracking logistics movements."
      />

      {/* Add / Edit Modal */}
      <TransportFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        transport={editingTransport}
        onSave={handleSaveTransport}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingTransport?.vehicle_number || 'Transport Vehicle'}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export { Transports as Vehicles }
export default Transports
