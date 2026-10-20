import { formatISTDateTime } from '@lib/dateUtils'
import { useState, useMemo, useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Phone,
  User as UserIcon,
  Copy,
  Check,
  Building2,
  CheckCircle2,
  PauseCircle,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { MasterDataTable } from '@components/master/MasterDataTable'
import { PartyFormModal } from '@components/master/PartyFormModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import { SkeletonTable } from '@components/ui/Skeleton'
import { useParties } from '@hooks/useMasterData'
import { useAuth } from '@hooks/useAuth'
import { exportToCSV } from '@lib/exportCSV'
import { cn } from '@lib/utils'
import type { Party } from '@types'

/**
 * Modern curated avatar palette
 */
const AVATAR_PALETTES = [
  { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80' },
  { bg: 'bg-violet-50 text-violet-700 border-violet-200/80' },
  { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' },
  { bg: 'bg-amber-50 text-amber-700 border-amber-200/80' },
  { bg: 'bg-rose-50 text-rose-700 border-rose-200/80' },
  { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200/80' },
  { bg: 'bg-sky-50 text-sky-700 border-sky-200/80' },
  { bg: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80' },
  { bg: 'bg-teal-50 text-teal-700 border-teal-200/80' },
]

function getAvatarStyle(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length
  return AVATAR_PALETTES[index]
}

function getInitials(name: string) {
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, '').trim()
  const words = clean.split(/\s+/)
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase() || 'P'
}

/**
 * Copyable GSTIN micro-component
 */
function CopyableGST({ gst }: { gst?: string }) {
  const [copied, setCopied] = useState(false)

  if (!gst) {
    return <span className="text-zinc-400 text-xs italic">Unregistered</span>
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(gst)
    setCopied(true)
    toast.success(`Copied GSTIN: ${gst}`)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy GSTIN"
      className="group/gst inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-50 hover:bg-zinc-100/90 border border-zinc-200/75 font-mono text-xs text-zinc-700 hover:text-zinc-900 transition-all cursor-pointer shadow-2xs"
    >
      <span>{gst}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600 shrink-0" />
      ) : (
        <Copy className="h-3 w-3 text-zinc-400 group-hover/gst:text-zinc-600 shrink-0 transition-colors" />
      )}
    </button>
  )
}

export function Parties() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const {
    parties,
    stats,
    isLoading,
    getNextPartyCode,
    createParty,
    updateParty,
    deleteParty,
    togglePartyStatus,
  } = useParties()

  // Local state for search, filters, modals
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<Party | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingParty, setDeletingParty] = useState<Party | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter parties based on search and status filter
  const filteredData = useMemo(() => {
    return parties.filter((party) => {
      // 1. Status Filter
      if (statusFilter === 'active' && !party.is_active) return false
      if (statusFilter === 'inactive' && party.is_active) return false

      // 2. Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim()
        const matchName = party.party_name.toLowerCase().includes(q)
        const matchCode = party.party_code.toLowerCase().includes(q)
        const matchContact = party.contact_person
          ? party.contact_person.toLowerCase().includes(q)
          : false
        const matchCity = party.city ? party.city.toLowerCase().includes(q) : false
        const matchState = party.state ? party.state.toLowerCase().includes(q) : false
        const matchGst = party.gst_number ? party.gst_number.toLowerCase().includes(q) : false
        const matchAddress = party.address ? party.address.toLowerCase().includes(q) : false
        return matchName || matchCode || matchContact || matchCity || matchState || matchGst || matchAddress
      }

      return true
    })
  }, [parties, searchQuery, statusFilter])

  // Open Form Modal for Create
  const handleOpenCreate = useCallback(() => {
    setEditingParty(null)
    setFormModalOpen(true)
  }, [])

  // Open Form Modal for Edit
  const handleOpenEdit = useCallback((party: Party) => {
    setEditingParty(party)
    setFormModalOpen(true)
  }, [])

  // Open Delete Confirmation
  const handleOpenDelete = useCallback((party: Party) => {
    setDeletingParty(party)
    setDeleteDialogOpen(true)
  }, [])

  // Handle Save (Create or Update)
  const handleSaveParty = async (data: Omit<Party, 'id' | 'created_at'>) => {
    if (editingParty) {
      await updateParty(editingParty.id, data)
    } else {
      await createParty(data)
    }
  }

  // Handle Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingParty) return
    setIsDeleting(true)
    try {
      await deleteParty(deletingParty.id)
      setDeleteDialogOpen(false)
      setDeletingParty(null)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle Export CSV
  const handleExportCSV = useCallback(() => {
    const exportHeaders = [
      { key: 'party_code', label: 'Party Code' },
      { key: 'party_name', label: 'Party Name' },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'phone', label: 'Phone' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'gst_number', label: 'GSTIN' },
      { key: 'address', label: 'Address' },
      { key: 'is_active', label: 'Is Active' },
    ]
    exportToCSV(filteredData, 'parties_master', exportHeaders)
  }, [filteredData])

  // Define High-Density Table Columns with 2025 SaaS Design
  const columns = useMemo<ColumnDef<Party>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        cell: ({ row }) => (
          <span className="text-zinc-400 font-mono text-xs">{row.index + 1}</span>
        ),
        enableSorting: false,
        size: 38,
      },
      {
        accessorKey: 'party_code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-100/80 text-zinc-800 font-mono font-bold text-xs border border-zinc-200/70 shadow-2xs">
            {row.original.party_code}
          </span>
        ),
        size: 80,
      },
      {
        accessorKey: 'party_name',
        header: 'Party / Company',
        cell: ({ row }) => {
          const party = row.original
          const palette = getAvatarStyle(party.party_name)
          const initials = getInitials(party.party_name)

          return (
            <div className="flex items-center gap-3 min-w-[200px]">
              {/* Initial Avatar Circle */}
              <div
                className={cn(
                  'h-8 w-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs border shadow-2xs select-none',
                  palette.bg
                )}
              >
                {initials}
              </div>

              {/* Two-line details */}
              <div className="space-y-0.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(party)}
                  className="text-left font-semibold text-[13px] text-zinc-900 hover:text-indigo-600 transition-colors cursor-pointer block leading-tight truncate"
                  title={party.party_name}
                >
                  {party.party_name}
                </button>
                {party.address ? (
                  <p
                    className="text-xs text-zinc-400 truncate max-w-[230px] flex items-center gap-1"
                    title={party.address}
                  >
                    <span>{party.address}</span>
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No address provided</p>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'contact_person',
        header: 'Contact & Phone',
        cell: ({ row }) => {
          const contact = row.original.contact_person
          const phone = row.original.phone
          return (
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-zinc-800 font-medium text-[13px] leading-tight">
                {contact ? (
                  <>
                    <UserIcon className="h-3 w-3 text-zinc-400 shrink-0" />
                    <span className="truncate max-w-[150px]">{contact}</span>
                  </>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </div>
              {phone ? (
                <div className="flex items-center gap-1 font-mono text-xs text-zinc-500">
                  <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                  <span>{phone}</span>
                </div>
              ) : (
                <span className="text-xs text-zinc-400 italic">—</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'city',
        header: 'Location',
        cell: ({ row }) => {
          const city = row.original.city
          const state = row.original.state
          if (!city && !state) {
            return <span className="text-zinc-400 text-xs">—</span>
          }
          return (
            <div className="space-y-0.5">
              <div className="text-[13px] font-medium text-zinc-800 leading-tight">
                {city || '—'}
              </div>
              {state && <div className="text-xs text-zinc-400">{state}</div>}
            </div>
          )
        },
      },
      {
        accessorKey: 'gst_number',
        header: 'GSTIN',
        cell: ({ row }) => <CopyableGST gst={row.original.gst_number} />,
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
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border select-none transition-colors shadow-2xs',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
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
        header: '',
        enableSorting: false,
        size: 110,
        cell: ({ row }) => {
          const party = row.original
          return (
            <div className="flex items-center justify-end">
              {/* Floating Pill on Hover */}
              <div className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-white border border-zinc-200/90 shadow-xs opacity-80 group-hover:opacity-100 transition-all duration-150 ease-out">
                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(party)}
                  title="Edit Party"
                  className="p-1.5 rounded-md text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>

                {/* Toggle Status Button */}
                <button
                  type="button"
                  onClick={() => togglePartyStatus(party.id)}
                  title={party.is_active ? 'Deactivate Party' : 'Activate Party'}
                  className={cn(
                    'p-1.5 rounded-md transition-colors cursor-pointer',
                    party.is_active
                      ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                      : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                  )}
                >
                  {party.is_active ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Delete Button (Admin only) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(party)}
                    title="Delete Party"
                    className="p-1.5 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        },
      },
    ],
    [isAdmin, handleOpenEdit, handleOpenDelete, togglePartyStatus]
  )

  return (
    <div className="space-y-4 select-none pb-12">
      {/* =========================================================================
          PAGE HEADER & MODERN STAT CHIPS STRIP
      ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        {/* Title & Description */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
              <Building2 className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
              <span>Parties & Suppliers</span>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                {stats.total}
              </span>
            </h1>
          </div>
          <p className="text-xs text-zinc-500">
            Directory of registered suppliers, vendors, and customer accounts.
          </p>
        </div>

        {/* 3 Refined Rounded Stat Chips */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Chip 1: Total */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
            <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-zinc-900 font-mono">{stats.total}</span>
              <span className="text-zinc-500 font-medium">Total</span>
            </div>
          </div>

          {/* Chip 2: Active */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-emerald-800 font-mono">{stats.active}</span>
              <span className="text-emerald-700 font-medium">Active</span>
            </div>
          </div>

          {/* Chip 3: Inactive / Paused */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80 shadow-2xs">
            <PauseCircle className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-zinc-700 font-mono">{stats.inactive}</span>
              <span className="text-zinc-500 font-medium">Paused</span>
            </div>
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
        searchPlaceholder="Search party name, code, contact, city, GST... (/)"
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
        addButtonLabel="Add Party"
        onExport={handleExportCSV}
        exportButtonLabel="Export CSV"
        emptyTitle="No party records found"
        emptyDescription="There are no supply partners matching your search or status criteria. Register a new party profile to get started."
        renderMobileCard={(party: Party) => {
          const palette = getAvatarStyle(party.party_name)
          const initials = getInitials(party.party_name)
          return (
            <div
              key={party.id}
              className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'h-9 w-9 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs border shadow-2xs',
                      palette.bg
                    )}
                  >
                    {initials}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-900">{party.party_name}</h3>
                    <span className="inline-block font-mono text-[11px] font-bold text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200/70">
                      {party.party_code}
                    </span>
                  </div>
                </div>

                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border select-none',
                    party.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200/80'
                  )}
                >
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      party.is_active ? 'bg-emerald-500' : 'bg-zinc-400'
                    )}
                  />
                  <span>{party.is_active ? 'Active' : 'Inactive'}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-100">
                <div>
                  <span className="text-zinc-400 block text-[11px]">Contact</span>
                  <span className="font-medium text-zinc-800">{party.contact_person || '—'}</span>
                  {party.phone && (
                    <span className="font-mono text-zinc-500 block text-[11px]">{party.phone}</span>
                  )}
                </div>

                <div>
                  <span className="text-zinc-400 block text-[11px]">Location</span>
                  <div className="flex items-center gap-1 text-zinc-700 font-medium">
                    <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
                    <span>{party.city || '—'}</span>
                  </div>
                  {party.state && <span className="text-zinc-400 text-[11px]">{party.state}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <CopyableGST gst={party.gst_number} />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(party)}
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 transition"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePartyStatus(party.id)}
                    className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 transition"
                  >
                    {party.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(party)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        }}
      />
      )}

      {/* =========================================================================
          MODALS: Add/Edit & Delete
      ========================================================================= */}
      <PartyFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        party={editingParty}
        onSave={handleSaveParty}
        nextCode={getNextPartyCode()}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingParty?.party_name || 'Party'}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default Parties
