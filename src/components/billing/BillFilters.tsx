import { useState, useMemo, useRef, useEffect } from 'react'
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
} from 'date-fns'
import {
  Search,
  X,
  ChevronDown,
  Check,
  Calendar,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react'
import { useParties, useQualities } from '@hooks/useMasterData'
import { cn } from '@lib/utils'
import type { BillFilters as BillFiltersType } from '@types'

export interface BillFiltersProps {
  filters: BillFiltersType
  onFiltersChange: (newFilters: BillFiltersType) => void
  totalRecordsCount?: number
  filteredCount?: number
  underCount?: number
  overCount?: number
  exactCount?: number
}

type QuickRangeType = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'all'

export function BillFilters({
  filters,
  onFiltersChange,
  totalRecordsCount = 25,
  filteredCount = 25,
  underCount = 16,
  overCount = 5,
  exactCount = 4,
}: BillFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { parties: masterParties } = useParties()
  const { qualities: masterQualities } = useQualities()

  // Dropdown states for pills
  const [openDropdown, setOpenDropdown] = useState<
    'date' | 'party' | 'quality' | 'status' | 'more' | null
  >(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cmd+K shortcut listener to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sync search input
  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    onFiltersChange({
      ...filters,
      search: val.trim() || undefined,
    })
  }

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.dateFrom || filters.dateTo) count++
    if (filters.partyIds && filters.partyIds.length > 0) count++
    if (filters.qualityIds && filters.qualityIds.length > 0) count++
    if (filters.lorryNumber?.trim()) count++
    if (filters.billingType && filters.billingType.length > 0) count++
    if (filters.paymentStatus && filters.paymentStatus.length > 0) count++
    if (filters.billNumber?.trim()) count++
    if (typeof filters.minQty === 'number' || typeof filters.maxQty === 'number') count++
    if (typeof filters.minRtgsAmount === 'number' || typeof filters.maxRtgsAmount === 'number') count++
    return count
  }, [filters])

  // Advanced filter count
  const advancedCount = useMemo(() => {
    let count = 0
    if (filters.lorryNumber?.trim()) count++
    if (filters.billNumber?.trim()) count++
    if (typeof filters.minQty === 'number' || typeof filters.maxQty === 'number') count++
    if (typeof filters.minRtgsAmount === 'number' || typeof filters.maxRtgsAmount === 'number') count++
    return count
  }, [filters])

  // Quick Date Range Handler
  const handleQuickRange = (range: QuickRangeType) => {
    const today = new Date()
    let from = ''
    let to = ''

    if (range === 'today') {
      from = format(today, 'yyyy-MM-dd')
      to = format(today, 'yyyy-MM-dd')
    } else if (range === 'yesterday') {
      const y = subDays(today, 1)
      from = format(y, 'yyyy-MM-dd')
      to = format(y, 'yyyy-MM-dd')
    } else if (range === 'week') {
      from = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      to = format(today, 'yyyy-MM-dd')
    } else if (range === 'month') {
      from = format(startOfMonth(today), 'yyyy-MM-dd')
      to = format(endOfMonth(today), 'yyyy-MM-dd')
    } else if (range === 'last_month') {
      const prev = subMonths(today, 1)
      from = format(startOfMonth(prev), 'yyyy-MM-dd')
      to = format(endOfMonth(prev), 'yyyy-MM-dd')
    }

    onFiltersChange({
      ...filters,
      dateFrom: from || undefined,
      dateTo: to || undefined,
    })
    setOpenDropdown(null)
  }

  // Active Billing Type tab selection
  const currentTab = useMemo(() => {
    if (!filters.billingType || filters.billingType.length === 0 || filters.billingType.length === 3) {
      return 'all'
    }
    if (filters.billingType.length === 1) {
      return filters.billingType[0]
    }
    return 'all'
  }, [filters.billingType])

  const handleTabSelect = (tab: 'all' | 'under' | 'over' | 'exact') => {
    if (tab === 'all') {
      onFiltersChange({ ...filters, billingType: undefined })
    } else {
      onFiltersChange({ ...filters, billingType: [tab] })
    }
  }

  // Party Multi-Select
  const handleToggleParty = (partyId: string) => {
    const current = filters.partyIds || []
    const updated = current.includes(partyId)
      ? current.filter((id) => id !== partyId)
      : [...current, partyId]

    onFiltersChange({
      ...filters,
      partyIds: updated.length > 0 ? updated : undefined,
    })
  }

  // Quality Multi-Select
  const handleToggleQuality = (qualityId: string) => {
    const current = filters.qualityIds || []
    const updated = current.includes(qualityId)
      ? current.filter((id) => id !== qualityId)
      : [...current, qualityId]

    onFiltersChange({
      ...filters,
      qualityIds: updated.length > 0 ? updated : undefined,
    })
  }

  // Status Multi-Select
  const handleToggleStatus = (status: string) => {
    const current = filters.paymentStatus || []
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]

    onFiltersChange({
      ...filters,
      paymentStatus: updated.length > 0 ? updated : undefined,
    })
  }

  // Clear all filters
  const handleClearAll = () => {
    setSearchTerm('')
    onFiltersChange({})
  }

  // Date pill label
  const datePillLabel = useMemo(() => {
    if (filters.dateFrom && filters.dateTo) {
      if (filters.dateFrom === filters.dateTo) {
        return format(new Date(filters.dateFrom), 'dd MMM')
      }
      return `${format(new Date(filters.dateFrom), 'dd MMM')} - ${format(new Date(filters.dateTo), 'dd MMM')}`
    }
    if (filters.dateFrom) return `From ${format(new Date(filters.dateFrom), 'dd MMM')}`
    if (filters.dateTo) return `To ${format(new Date(filters.dateTo), 'dd MMM')}`
    return 'Date Range'
  }, [filters.dateFrom, filters.dateTo])

  return (
    <div className="space-y-3 select-none">
      {/* 1. COMMAND SEARCH BAR (HERO ELEMENT) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <Search className="w-4 h-4 text-[#A6A8AE]" />
        </div>

        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search or jump to bill, supplier code, lorry plate, quality grade…"
          className="w-full h-11 pl-10 pr-24 rounded-xl bg-white border border-[#ECECEE] text-sm text-[#17181A] placeholder:text-[#A6A8AE] focus:outline-none focus:border-[#17181A] focus:ring-2 focus:ring-black/5 shadow-2xs hover:border-[#E0E0E3] transition-all duration-150"
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F7F7F8] text-[#6E7076] border border-[#ECECEE]">
            ⌘K
          </span>
        </div>
      </div>

      {/* 2. FILTER RAIL: SEGMENTED TABS ON LEFT + DROPDOWN PILLS ON RIGHT */}
      <div
        ref={dropdownRef}
        className="bg-white rounded-xl border border-[#ECECEE] p-2 sm:p-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs relative"
      >
        {/* LEFT: Segmented Underlined Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b sm:border-b-0 border-gray-100 pb-1.5 sm:pb-0">
          <button
            type="button"
            onClick={() => handleTabSelect('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all relative flex items-center gap-1.5',
              currentTab === 'all'
                ? 'bg-[#17181A] text-white font-semibold shadow-2xs'
                : 'text-[#6E7076] hover:text-[#17181A] hover:bg-[#F7F7F8]'
            )}
          >
            <span>All</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                currentTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              {totalRecordsCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSelect('under')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all relative flex items-center gap-1.5',
              currentTab === 'under'
                ? 'bg-orange-600 text-white font-semibold shadow-2xs'
                : 'text-[#6E7076] hover:text-orange-700 hover:bg-orange-50/50'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
            <span>Under Billing</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                currentTab === 'under' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
              )}
            >
              {underCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSelect('over')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all relative flex items-center gap-1.5',
              currentTab === 'over'
                ? 'bg-red-600 text-white font-semibold shadow-2xs'
                : 'text-[#6E7076] hover:text-red-600 hover:bg-red-50/50'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span>Over Billing</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                currentTab === 'over' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
              )}
            >
              {overCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSelect('exact')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all relative flex items-center gap-1.5',
              currentTab === 'exact'
                ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                : 'text-[#6E7076] hover:text-emerald-700 hover:bg-emerald-50/50'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Exact</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                currentTab === 'exact' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
              )}
            >
              {exactCount}
            </span>
          </button>
        </div>

        {/* RIGHT: Dropdown filter triggers */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {/* DATE RANGE PILL */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
              className={cn(
                'h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors',
                filters.dateFrom || filters.dateTo
                  ? 'bg-[#17181A] text-white border-[#17181A]'
                  : 'bg-white border-[#ECECEE] text-[#6E7076] hover:border-[#E0E0E3] hover:bg-[#F7F7F8]'
              )}
            >
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              <span>{datePillLabel}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {openDropdown === 'date' && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white border border-[#ECECEE] rounded-xl shadow-lg z-30 p-2 text-xs space-y-2 animate-in fade-in-50 zoom-in-95">
                <div className="font-semibold text-gray-900 px-2 py-1">Quick Select</div>
                <div className="grid grid-cols-2 gap-1 px-1">
                  <button
                    type="button"
                    onClick={() => handleQuickRange('today')}
                    className="px-2 py-1.5 rounded-lg hover:bg-gray-100 text-left text-gray-700 font-medium"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRange('yesterday')}
                    className="px-2 py-1.5 rounded-lg hover:bg-gray-100 text-left text-gray-700 font-medium"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRange('week')}
                    className="px-2 py-1.5 rounded-lg hover:bg-gray-100 text-left text-gray-700 font-medium"
                  >
                    This Week
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRange('month')}
                    className="px-2 py-1.5 rounded-lg hover:bg-gray-100 text-left text-gray-700 font-medium"
                  >
                    This Month
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRange('last_month')}
                    className="px-2 py-1.5 rounded-lg hover:bg-gray-100 text-left text-gray-700 font-medium col-span-2"
                  >
                    Last Month
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-100 px-2 space-y-2">
                  <span className="font-semibold text-gray-900 block">Custom Range</span>
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={filters.dateFrom || ''}
                      onChange={(e) =>
                        onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
                      }
                      className="w-full h-7 px-2 border rounded-md text-[11px]"
                    />
                    <input
                      type="date"
                      value={filters.dateTo || ''}
                      onChange={(e) =>
                        onFiltersChange({ ...filters, dateTo: e.target.value || undefined })
                      }
                      className="w-full h-7 px-2 border rounded-md text-[11px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PARTY PILL */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'party' ? null : 'party')}
              className={cn(
                'h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors',
                filters.partyIds && filters.partyIds.length > 0
                  ? 'bg-[#17181A] text-white border-[#17181A]'
                  : 'bg-white border-[#ECECEE] text-[#6E7076] hover:border-[#E0E0E3] hover:bg-[#F7F7F8]'
              )}
            >
              <span>
                Party{filters.partyIds?.length ? ` (${filters.partyIds.length})` : ''}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {openDropdown === 'party' && (
              <div className="absolute right-0 mt-1.5 w-64 max-h-72 overflow-y-auto bg-white border border-[#ECECEE] rounded-xl shadow-lg z-30 p-2 text-xs divide-y divide-gray-100 animate-in fade-in-50 zoom-in-95">
                <div className="p-1 space-y-1">
                  {masterParties.map((p) => {
                    const isSelected = filters.partyIds?.includes(p.id)
                    const code = (masterParties.find(p => p.id === p.id)?.party_code || "—") || p.party_code
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleToggleParty(p.id)}
                        className="w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 flex items-center justify-between text-left text-gray-800"
                      >
                        <div className="truncate">
                          <span className="font-mono font-semibold text-gray-900 mr-1.5">{code}</span>
                          <span className="text-gray-500">{p.party_name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* QUALITY PILL */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'quality' ? null : 'quality')}
              className={cn(
                'h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors',
                filters.qualityIds && filters.qualityIds.length > 0
                  ? 'bg-[#17181A] text-white border-[#17181A]'
                  : 'bg-white border-[#ECECEE] text-[#6E7076] hover:border-[#E0E0E3] hover:bg-[#F7F7F8]'
              )}
            >
              <span>
                Quality{filters.qualityIds?.length ? ` (${filters.qualityIds.length})` : ''}
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {openDropdown === 'quality' && (
              <div className="absolute right-0 mt-1.5 w-56 max-h-64 overflow-y-auto bg-white border border-[#ECECEE] rounded-xl shadow-lg z-30 p-2 text-xs space-y-1 animate-in fade-in-50 zoom-in-95">
                {masterQualities.map((q) => {
                  const isSelected = filters.qualityIds?.includes(q.id)
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleToggleQuality(q.id)}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 flex items-center justify-between text-left text-gray-800"
                    >
                      <span>{q.quality_name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* STATUS PILL */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className={cn(
                'h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors',
                filters.paymentStatus && filters.paymentStatus.length > 0
                  ? 'bg-[#17181A] text-white border-[#17181A]'
                  : 'bg-white border-[#ECECEE] text-[#6E7076] hover:border-[#E0E0E3] hover:bg-[#F7F7F8]'
              )}
            >
              <span>Status</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {openDropdown === 'status' && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#ECECEE] rounded-xl shadow-lg z-30 p-2 text-xs space-y-1 animate-in fade-in-50 zoom-in-95">
                {[
                  { key: 'pending', label: 'Pending Settlement', dot: 'bg-amber-500' },
                  { key: 'paid', label: 'Paid in Full', dot: 'bg-emerald-500' },
                  { key: 'partial', label: 'Partially Paid', dot: 'bg-violet-500' },
                  { key: 'na', label: 'N/A (Exact Rate)', dot: 'bg-gray-400' },
                ].map((st) => {
                  const isSelected = filters.paymentStatus?.includes(st.key)
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => handleToggleStatus(st.key)}
                      className="w-full px-2 py-1.5 rounded-lg hover:bg-gray-50 flex items-center justify-between text-left text-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', st.dot)} />
                        <span>{st.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* MORE ADVANCED FILTERS TOGGLE */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              'h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors',
              advancedCount > 0 || showAdvanced
                ? 'bg-[#17181A] text-white border-[#17181A]'
                : 'bg-white border-[#ECECEE] text-[#6E7076] hover:border-[#E0E0E3] hover:bg-[#F7F7F8]'
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>More</span>
            {advancedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] flex items-center justify-center font-bold">
                {advancedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. COLLAPSIBLE ADVANCED FILTERS PANEL */}
      {showAdvanced && (
        <div className="bg-white rounded-xl border border-[#ECECEE] p-4 shadow-sm animate-in slide-in-from-top-2 duration-150 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#17181A]">
              Advanced Search Parameters
            </span>
            <button
              type="button"
              onClick={() => setShowAdvanced(false)}
              className="text-xs text-gray-400 hover:text-gray-700 font-medium"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Lorry Plate */}
            <div>
              <label className="block text-[11px] font-semibold text-[#6E7076] mb-1">
                Lorry Plate Registration
              </label>
              <input
                type="text"
                placeholder="e.g. GJ 01 AA 9876"
                value={filters.lorryNumber || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, lorryNumber: e.target.value || undefined })
                }
                className="w-full h-8 px-2.5 rounded-lg border border-[#ECECEE] bg-[#FCFCFD] font-mono text-xs focus:outline-none focus:border-[#17181A]"
              />
            </div>

            {/* Invoice / Bill Ref */}
            <div>
              <label className="block text-[11px] font-semibold text-[#6E7076] mb-1">
                Invoice / Bill Number
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2451"
                value={filters.billNumber || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, billNumber: e.target.value || undefined })
                }
                className="w-full h-8 px-2.5 rounded-lg border border-[#ECECEE] bg-[#FCFCFD] font-mono text-xs focus:outline-none focus:border-[#17181A]"
              />
            </div>

            {/* Qty Range */}
            <div>
              <label className="block text-[11px] font-semibold text-[#6E7076] mb-1">
                Quantity (MT Range)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minQty ?? ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      minQty: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-8 px-2 rounded-lg border border-[#ECECEE] bg-[#FCFCFD] font-mono text-xs focus:outline-none focus:border-[#17181A]"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxQty ?? ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      maxQty: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-8 px-2 rounded-lg border border-[#ECECEE] bg-[#FCFCFD] font-mono text-xs focus:outline-none focus:border-[#17181A]"
                />
              </div>
            </div>

            {/* RTGS Amount Range */}
            <div>
              <label className="block text-[11px] font-semibold text-[#6E7076] mb-1">
                RTGS Amount (₹ Range)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={filters.minRtgsAmount ?? ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      minRtgsAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-8 px-2 rounded-lg border border-[#ECECEE] bg-[#FCFCFD] font-mono text-xs focus:outline-none focus:border-[#17181A]"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={filters.maxRtgsAmount ?? ''}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      maxRtgsAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full h-8 px-2 rounded-lg border border-[#ECECEE] bg-[#FCFCFD] font-mono text-xs focus:outline-none focus:border-[#17181A]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ACTIVE FILTER CHIPS ROW */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A6A8AE]">
            Active Filters ({filteredCount} results):
          </span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
              <span>Search: "{filters.search}"</span>
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(filters.dateFrom || filters.dateTo) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
              <span>{datePillLabel}</span>
              <button
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })
                }
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.partyIds?.map((pid) => {
            const p = masterParties.find((x) => x.id === pid)
            const code = (masterParties.find(p => p.id === pid)?.party_code || "—") || p?.party_code || pid
            return (
              <span
                key={pid}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 font-mono"
              >
                <span>{code}</span>
                <button
                  type="button"
                  onClick={() => handleToggleParty(pid)}
                  className="hover:text-red-600 font-sans"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}

          {filters.qualityIds?.map((qid) => {
            const q = masterQualities.find((x) => x.id === qid)
            return (
              <span
                key={qid}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200"
              >
                <span>{q?.quality_name || qid}</span>
                <button
                  type="button"
                  onClick={() => handleToggleQuality(qid)}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}

          {filters.paymentStatus?.map((st) => (
            <span
              key={st}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 uppercase"
            >
              <span>{st}</span>
              <button
                type="button"
                onClick={() => handleToggleStatus(st)}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.lorryNumber && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200 font-mono">
              <span>Lorry: {filters.lorryNumber}</span>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, lorryNumber: undefined })}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline flex items-center gap-1 ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all filters</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default BillFilters
