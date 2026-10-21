import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ChevronRight,
  Home,
  Building2,
  Truck,
  Award,
  Pencil,
  Eye,
  EyeOff,
  Trash2,
  Phone,
  User as UserIcon,
  Copy,
  Check,
  MapPin,
  FileText,
  IndianRupee,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@components/ui/PageHeader'
import { MasterDataTable } from '@components/master/MasterDataTable'
import { PartyModal } from '@components/master/PartyModal'
import { TransporterModal } from '@components/master/TransporterModal'
import { GradeModal } from '@components/master/GradeModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import { useParties, useTransporters, useQualities } from '@hooks/useMasterData'
import { useAuth } from '@hooks/useAuth'
import { cn } from '@lib/utils'
import type { Transporter } from '@types'
import type { PartyModel } from '@/services/partiesService'
import type { QualityGradeWithStock } from '@/services/gradesService'
import type { CreateTransporterInput } from '@/services/transporterService'

export type MasterTab = 'parties' | 'transporters' | 'grades'

export interface MasterHubProps {
  initialTab?: MasterTab
  defaultTab?: MasterTab
}

export function MasterHub({ initialTab, defaultTab }: MasterHubProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [searchParams, setSearchParams] = useSearchParams()

  // Determine initial tab: URL query param -> initialTab/defaultTab prop -> 'parties'
  const tabFromUrl = searchParams.get('tab') as MasterTab | null
  const startingTab: MasterTab =
    (tabFromUrl && ['parties', 'transporters', 'grades'].includes(tabFromUrl) ? tabFromUrl : null) ||
    initialTab ||
    defaultTab ||
    'parties'

  const [activeTab, setActiveTab] = useState<MasterTab>(startingTab)

  // Sync activeTab with URL search params when user navigates (e.g. back/forward button or external change)
  useEffect(() => {
    const qTab = searchParams.get('tab') as MasterTab | null
    if (qTab && ['parties', 'transporters', 'grades'].includes(qTab)) {
      setActiveTab(qTab)
    }
  }, [searchParams])

  // Single-Click Instant State Switch:
  // Synchronously updates local state on the very first click, then syncs URL search params
  const handleTabChange = (tab: MasterTab) => {
    setActiveTab(tab)
    setSearchParams({ tab }, { replace: true })
  }

  // =========================================================================
  // 1. DATA HOOKS
  // =========================================================================
  const {
    parties,
    stats: partyStats,
    isLoading: loadingParties,
    createParty,
    updateParty,
    deleteParty,
    togglePartyStatus,
    getNextPartyCode,
  } = useParties()

  const {
    transporters,
    stats: transporterStats,
    isLoading: loadingTransporters,
    createTransporter,
    updateTransporter,
    deleteTransporter,
    toggleTransporterStatus,
  } = useTransporters()

  const {
    qualities,
    stats: qualityStats,
    isLoading: loadingQualities,
    createQuality,
    updateQuality,
    deleteQuality,
    toggleQualityStatus,
    getNextQualityCode,
  } = useQualities()

  // Copy helper for GSTIN & Codes
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Copied ' + label + ': ' + text)
    setTimeout(() => setCopiedId(null), 1500)
  }

  // =========================================================================
  // 2. MODAL & DIALOG STATES (STRICT SEPARATION)
  // =========================================================================
  // Party Modal
  const [partyModalOpen, setPartyModalOpen] = useState(false)
  const [editingParty, setEditingParty] = useState<PartyModel | null>(null)

  // Transporter Modal
  const [transporterModalOpen, setTransporterModalOpen] = useState(false)
  const [editingTransporter, setEditingTransporter] = useState<Transporter | null>(null)

  // Quality Grade Modal
  const [gradeModalOpen, setGradeModalOpen] = useState(false)
  const [editingGrade, setEditingGrade] = useState<QualityGradeWithStock | null>(null)

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{
    id: string
    name: string
    type: 'party' | 'transporter' | 'grade'
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Status Filter & Search Query per Tab
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Clear search on tab switch
  useEffect(() => {
    setSearchQuery('')
    setStatusFilter('all')
  }, [activeTab])

  // =========================================================================
  // 3. TAB 1: PARTIES LOGIC & COLUMNS
  // =========================================================================
  // Filter out pure transporters from parties table to maintain strict trading accounts isolation
  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      // Exclude parties that are ONLY transporters (if any remain)
      const types = p.types || []
      const isTradingParty = types.includes('BUYER') || types.includes('SELLER') || types.length === 0
      if (!isTradingParty) return false

      if (statusFilter === 'active' && !p.is_active) return false
      if (statusFilter === 'inactive' && p.is_active) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const code = (p.party_code || p.code || '').toLowerCase()
      const name = (p.party_name || p.name || '').toLowerCase()
      const gstin = (p.gst_number || p.gstin || '').toLowerCase()
      const contact = (p.contact_person || p.contactPerson || '').toLowerCase()
      const phone = (p.phone || '').toLowerCase()
      const city = (p.city || '').toLowerCase()

      return (
        code.includes(q) ||
        name.includes(q) ||
        gstin.includes(q) ||
        contact.includes(q) ||
        phone.includes(q) ||
        city.includes(q)
      )
    })
  }, [parties, statusFilter, searchQuery])

  const partyColumns = useMemo<ColumnDef<PartyModel>[]>(
    () => [
      {
        accessorKey: 'party_code',
        header: 'Code',
        cell: ({ row }) => {
          const code = row.original.party_code || row.original.code
          const isCopied = copiedId === 'code-' + row.original.id
          return (
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-900">
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                {code}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(code, 'code-' + row.original.id, 'Code')}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                title="Copy Code"
              >
                {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )
        },
        size: 110,
      },
      {
        accessorKey: 'party_name',
        header: 'Trading Account Name',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-semibold text-xs sm:text-sm text-zinc-900 block truncate max-w-[220px]">
              {row.original.party_name || row.original.name}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <MapPin className="h-3 w-3 text-zinc-400 shrink-0" />
              <span>{row.original.city || '—'}, {row.original.state || 'Maharashtra'}</span>
            </div>
          </div>
        ),
      },
      {
        id: 'types',
        header: 'Type',
        cell: ({ row }) => {
          const types = row.original.types || ['BUYER']
          const isBuyer = types.includes('BUYER')
          const isSeller = types.includes('SELLER')

          return (
            <div className="flex flex-wrap gap-1">
              {isBuyer && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Buyer
                </span>
              )}
              {isSeller && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Seller
                </span>
              )}
            </div>
          )
        },
        size: 120,
      },
      {
        accessorKey: 'gstin',
        header: 'GSTIN',
        cell: ({ row }) => {
          const gst = row.original.gst_number || row.original.gstin
          if (!gst) return <span className="text-xs text-zinc-400">—</span>
          const isCopied = copiedId === 'gst-' + row.original.id

          return (
            <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-700">
              <FileText className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>{gst}</span>
              <button
                type="button"
                onClick={() => handleCopy(gst, 'gst-' + row.original.id, 'GSTIN')}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                title="Copy GSTIN"
              >
                {isCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )
        },
      },
      {
        id: 'contact_and_phone',
        header: 'Contact Person & Phone',
        cell: ({ row }) => {
          const contact = row.original.contact_person || row.original.contactPerson
          const phone = row.original.phone
          if (!contact && !phone) return <span className="text-xs text-zinc-400">—</span>

          return (
            <div className="space-y-0.5 text-xs">
              {contact && (
                <div className="flex items-center gap-1.5 font-medium text-zinc-700">
                  <UserIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate max-w-[140px]">{contact}</span>
                </div>
              )}
              {phone && (
                <a
                  href={'tel:' + phone}
                  className="inline-flex items-center gap-1 font-mono text-zinc-600 hover:text-blue-600 hover:underline transition"
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
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 90,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setEditingParty(item)
                  setPartyModalOpen(true)
                }}
                title="Edit Party"
                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => togglePartyStatus(item.id)}
                title={item.is_active ? 'Deactivate Party' : 'Activate Party'}
                className={cn(
                  'p-1.5 rounded-lg transition cursor-pointer',
                  item.is_active
                    ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                    : 'text-emerald-600 hover:bg-emerald-50'
                )}
              >
                {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDeletingItem({
                      id: item.id,
                      name: item.party_name || item.name,
                      type: 'party',
                    })
                    setDeleteDialogOpen(true)
                  }}
                  title="Delete Party"
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
    [copiedId, isAdmin, togglePartyStatus]
  )

  // =========================================================================
  // 4. TAB 2: TRANSPORTERS LOGIC & COLUMNS
  // =========================================================================
  const filteredTransporters = useMemo(() => {
    return transporters.filter((t) => {
      if (statusFilter === 'active' && !t.is_active) return false
      if (statusFilter === 'inactive' && t.is_active) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const name = (t.name || '').toLowerCase()
      const contact = (t.contact_person || '').toLowerCase()
      const phone = (t.phone || '').toLowerCase()
      const city = (t.city || '').toLowerCase()

      return name.includes(q) || contact.includes(q) || phone.includes(q) || city.includes(q)
    })
  }, [transporters, statusFilter, searchQuery])

  const transporterColumns = useMemo<ColumnDef<Transporter>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Transporter / Agency Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-zinc-900 block truncate max-w-[240px]">
                {row.original.name}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Logistics Provider</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'contact_person',
        header: 'Contact Person',
        cell: ({ row }) => {
          const contact = row.original.contact_person
          if (!contact) return <span className="text-xs text-zinc-400">—</span>
          return (
            <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
              <UserIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>{contact}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone Number',
        cell: ({ row }) => {
          const phone = row.original.phone
          if (!phone) return <span className="text-xs text-zinc-400">—</span>
          return (
            <a
              href={'tel:' + phone}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-zinc-700 hover:text-emerald-600 hover:underline transition"
            >
              <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>{phone}</span>
            </a>
          )
        },
      },
      {
        accessorKey: 'city',
        header: 'City / Base Depot',
        cell: ({ row }) => {
          const city = row.original.city
          if (!city) return <span className="text-xs text-zinc-400">—</span>
          return (
            <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium">
              <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>{city}</span>
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
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 90,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setEditingTransporter(item)
                  setTransporterModalOpen(true)
                }}
                title="Edit Transporter"
                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => toggleTransporterStatus(item.id)}
                title={item.is_active ? 'Deactivate Transporter' : 'Activate Transporter'}
                className={cn(
                  'p-1.5 rounded-lg transition cursor-pointer',
                  item.is_active
                    ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                    : 'text-emerald-600 hover:bg-emerald-50'
                )}
              >
                {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDeletingItem({
                      id: item.id,
                      name: item.name,
                      type: 'transporter',
                    })
                    setDeleteDialogOpen(true)
                  }}
                  title="Delete Transporter"
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
    [isAdmin, toggleTransporterStatus]
  )

  // =========================================================================
  // 5. TAB 3: QUALITY GRADES LOGIC & COLUMNS
  // =========================================================================
  const filteredGrades = useMemo(() => {
    return qualities.filter((g) => {
      if (statusFilter === 'active' && !g.is_active) return false
      if (statusFilter === 'inactive' && g.is_active) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const name = (g.quality_name || g.name || '').toLowerCase()
      const code = (g.quality_code || '').toLowerCase()
      const hsn = (g.hsn_code || g.hsnCode || '').toLowerCase()
      const category = (g.category || '').toLowerCase()

      return name.includes(q) || code.includes(q) || hsn.includes(q) || category.includes(q)
    })
  }, [qualities, statusFilter, searchQuery])

  const gradeColumns = useMemo<ColumnDef<QualityGradeWithStock>[]>(
    () => [
      {
        accessorKey: 'quality_code',
        header: 'Code',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80">
            {row.original.quality_code || row.original.name}
          </span>
        ),
        size: 90,
      },
      {
        accessorKey: 'quality_name',
        header: 'Grade / Material Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 shrink-0">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-xs sm:text-sm text-zinc-900 block truncate max-w-[200px]">
                {row.original.quality_name || row.original.name}
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                {row.original.category || 'Scrap'}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'hsn_code',
        header: 'HSN Code',
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200/80">
            {row.original.hsn_code || row.original.hsnCode || '7204'}
          </span>
        ),
        size: 110,
      },
      {
        id: 'default_rate',
        header: 'Default Rate',
        cell: ({ row }) => {
          const rate = Number(row.original.default_rate_per_kg ?? (row.original as any).defaultRatePerKg ?? 0)
          return (
            <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-700">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
              <span>{rate > 0 ? rate.toFixed(2) + '/kg' : '—'}</span>
            </div>
          )
        },
        size: 120,
      },
      {
        id: 'stock',
        header: 'Current Stock',
        cell: ({ row }) => {
          const stockMt = Number(row.original.current_stock_mt ?? (row.original as any).currentStockMt ?? 0)
          return (
            <div className="font-mono text-xs font-semibold text-zinc-800">
              <span>{stockMt.toFixed(3)} MT</span>
            </div>
          )
        },
        size: 130,
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
        id: 'actions',
        header: '',
        enableSorting: false,
        size: 90,
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setEditingGrade(item)
                  setGradeModalOpen(true)
                }}
                title="Edit Grade"
                className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => toggleQualityStatus(item.id)}
                title={item.is_active ? 'Deactivate Grade' : 'Activate Grade'}
                className={cn(
                  'p-1.5 rounded-lg transition cursor-pointer',
                  item.is_active
                    ? 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
                    : 'text-emerald-600 hover:bg-emerald-50'
                )}
              >
                {item.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setDeletingItem({
                      id: item.id,
                      name: item.quality_name || item.name,
                      type: 'grade',
                    })
                    setDeleteDialogOpen(true)
                  }}
                  title="Delete Grade"
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
    [isAdmin, toggleQualityStatus]
  )

  // =========================================================================
  // 6. CONTEXT-AWARE "+ ADD" ACTION
  // =========================================================================
  const handleOpenAdd = () => {
    if (activeTab === 'parties') {
      setEditingParty(null)
      setPartyModalOpen(true)
    } else if (activeTab === 'transporters') {
      setEditingTransporter(null)
      setTransporterModalOpen(true)
    } else if (activeTab === 'grades') {
      setEditingGrade(null)
      setGradeModalOpen(true)
    }
  }

  const addButtonLabel =
    activeTab === 'parties'
      ? '+ Add Party'
      : activeTab === 'transporters'
      ? '+ Add Transporter'
      : '+ Add Quality Grade'

  // =========================================================================
  // 7. SAVE HANDLERS
  // =========================================================================
  const handleSaveParty = async (data: any) => {
    if (editingParty) {
      await updateParty(editingParty.id, data)
    } else {
      await createParty(data)
    }
    setPartyModalOpen(false)
  }

  const handleSaveTransporter = async (data: CreateTransporterInput) => {
    if (editingTransporter) {
      await updateTransporter(editingTransporter.id, data)
    } else {
      await createTransporter(data)
    }
    setTransporterModalOpen(false)
  }

  const handleSaveGrade = async (data: any) => {
    if (editingGrade) {
      await updateQuality(editingGrade.id, data)
    } else {
      await createQuality(data)
    }
    setGradeModalOpen(false)
  }

  // =========================================================================
  // 8. DELETE CONFIRMATION HANDLER
  // =========================================================================
  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      if (deletingItem.type === 'party') {
        await deleteParty(deletingItem.id)
      } else if (deletingItem.type === 'transporter') {
        await deleteTransporter(deletingItem.id)
      } else if (deletingItem.type === 'grade') {
        await deleteQuality(deletingItem.id)
      }
      setDeleteDialogOpen(false)
      setDeletingItem(null)
    } catch {
      // Error handled by hook toast
    } finally {
      setIsDeleting(false)
    }
  }

  // Dynamic Header & Breadcrumbs based on activeTab
  const tabConfig = {
    parties: {
      title: 'Party Master',
      subtitle: 'Unified directory of registered buyer and seller commercial trading accounts.',
      breadcrumb: 'Parties',
    },
    transporters: {
      title: 'Transporters Master',
      subtitle: 'Directory of authorized logistics transporter agencies and fleet operators.',
      breadcrumb: 'Transporters',
    },
    grades: {
      title: 'Quality Grades Master',
      subtitle: 'Specifications, default rates, and live warehouse inventory positions across scrap grades.',
      breadcrumb: 'Quality Grades',
    },
  }[activeTab]

  return (
    <div className="space-y-5 select-none pb-12">
      {/* Breadcrumb: Home > Master Data > Parties / Transporters / Quality Grades */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link to="/dashboard" className="hover:text-blue-600 transition flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link to="/master" className="hover:text-blue-600 transition">
          <span>Master Data</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-bold text-slate-800">{tabConfig.breadcrumb}</span>
      </nav>

      {/* Dynamic Header */}
      <PageHeader
        title={tabConfig.title}
        subtitle={tabConfig.subtitle}
      />

      {/* =========================================================================
          TOP SEGMENTED 3-BUTTON BAR
      ========================================================================= */}
      <div className="p-1.5 bg-zinc-100/90 rounded-2xl border border-zinc-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch gap-1.5">
        <button
          type="button"
          onClick={() => handleTabChange('parties')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'parties'
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/90'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
          )}
        >
          <Building2 className={cn('h-4 w-4', activeTab === 'parties' ? 'text-blue-600' : 'text-zinc-400')} />
          <span>Parties (Buyer / Seller)</span>
          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/70">
            {partyStats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('transporters')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'transporters'
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/90'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
          )}
        >
          <Truck className={cn('h-4 w-4', activeTab === 'transporters' ? 'text-emerald-600' : 'text-zinc-400')} />
          <span>Transporters</span>
          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/70">
            {transporterStats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('grades')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer',
            activeTab === 'grades'
              ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/90'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
          )}
        >
          <Award className={cn('h-4 w-4', activeTab === 'grades' ? 'text-purple-600' : 'text-zinc-400')} />
          <span>Quality Grades</span>
          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/70">
            {qualityStats.total}
          </span>
        </button>
      </div>

      {/* =========================================================================
          ACTIVE TAB DATA TABLE
      ========================================================================= */}
      {activeTab === 'parties' && (
        <MasterDataTable
          columns={partyColumns}
          data={filteredParties}
          isLoading={loadingParties}
          searchPlaceholder="Search party name, code, GSTIN, phone, city..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusCounts={{
            all: partyStats.total,
            active: partyStats.active,
            inactive: partyStats.inactive,
          }}
          onAdd={handleOpenAdd}
          addButtonLabel={addButtonLabel}
          emptyTitle="No trading parties found"
          emptyDescription="There are no buyers or sellers matching your filter. Add a new trading account to begin registering transactions."
        />
      )}

      {activeTab === 'transporters' && (
        <MasterDataTable
          columns={transporterColumns}
          data={filteredTransporters}
          isLoading={loadingTransporters}
          searchPlaceholder="Search transporter agency, contact person, phone, city..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusCounts={{
            all: transporterStats.total,
            active: transporterStats.active,
            inactive: transporterStats.inactive,
          }}
          onAdd={handleOpenAdd}
          addButtonLabel={addButtonLabel}
          emptyTitle="No transporter agencies found"
          emptyDescription="There are no logistics agencies registered. Add a transporter agency to assign dispatches and transport contracts."
        />
      )}

      {activeTab === 'grades' && (
        <MasterDataTable
          columns={gradeColumns}
          data={filteredGrades}
          isLoading={loadingQualities}
          searchPlaceholder="Search grade name, code, HSN code, category..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusCounts={{
            all: qualityStats.total,
            active: qualityStats.active,
            inactive: qualityStats.inactive,
          }}
          onAdd={handleOpenAdd}
          addButtonLabel={addButtonLabel}
          emptyTitle="No quality grades found"
          emptyDescription="There are no commodity grades configured. Add scrap material qualities to track weighments and stock valuation."
        />
      )}

      {/* =========================================================================
          STRICTLY ISOLATED SEPARATE MODALS
      ========================================================================= */}
      {/* 1. Party Modal */}
      <PartyModal
        open={partyModalOpen}
        onClose={() => setPartyModalOpen(false)}
        party={editingParty}
        onSave={handleSaveParty}
        nextCode={getNextPartyCode()}
      />

      {/* 2. Transporter Modal */}
      <TransporterModal
        open={transporterModalOpen}
        onClose={() => setTransporterModalOpen(false)}
        transporter={editingTransporter}
        onSave={handleSaveTransporter}
      />

      {/* 3. Quality Grade Modal */}
      <GradeModal
        open={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        quality={editingGrade}
        onSave={handleSaveGrade}
        nextCode={getNextQualityCode()}
      />

      {/* 4. Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingItem?.name || 'Record'}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default MasterHub
