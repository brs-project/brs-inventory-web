import { useState, useMemo, useRef, useEffect } from 'react'
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns'
import {
  Calendar,
  Layers,
  Truck,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
} from 'lucide-react'
import { useParties, useQualities } from '@hooks/useMasterData'
import { useDispatch } from '@hooks/useDispatch'
import { cn } from '@lib/utils'
import type { DispatchFilters as DispatchFilterType } from '@types'

export interface DispatchFiltersProps {
  filters: DispatchFilterType
  onFiltersChange: (newFilters: DispatchFilterType) => void
  totalRecordsCount?: number
  filteredCount?: number
  statusCounts?: {
    all: number
    dispatched: number
    draft: number
    cancelled: number
  }
}

type QuickRangePreset = 'today' | 'week' | 'month' | 'last_month' | 'all' | 'custom'

export function DispatchFilters({
  filters,
  onFiltersChange,
  statusCounts,
}: DispatchFiltersProps) {
  const { getTransporters } = useDispatch()
  const { parties: masterParties } = useParties()
  const { qualities: masterQualities } = useQualities()
  const transporterList = useMemo(() => getTransporters(), [getTransporters])

  const [activePopover, setActivePopover] = useState<
    'date' | 'quality' | 'transporter' | 'more' | null
  >(null)
  const filterRailRef = useRef<HTMLDivElement>(null)

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRailRef.current && !filterRailRef.current.contains(e.target as Node)) {
        setActivePopover(null)
      }
    }
    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activePopover])

  // Direct filter values
  const dateFrom = filters.dateFrom || ''
  const dateTo = filters.dateTo || ''
  const partyIds = filters.partyIds || []
  const qualityIds = filters.qualityIds || []
  const status = filters.status || []
  const lorryNumber = filters.lorryNumber || ''
  const transporter = filters.transporter || ''
  const billNumber = filters.billNumber || ''
  const dispatchBillNumber = filters.dispatchBillNumber || ''
  const minWeight = filters.minWeight !== undefined ? filters.minWeight : ''
  const maxWeight = filters.maxWeight !== undefined ? filters.maxWeight : ''

  // Current active status tab
  const activeStatusTab: 'all' | 'dispatched' | 'draft' | 'cancelled' = useMemo(() => {
    if (!status || status.length === 0) return 'all'
    if (status.length === 1) {
      if (status[0] === 'dispatched') return 'dispatched'
      if (status[0] === 'draft') return 'draft'
      if (status[0] === 'cancelled') return 'cancelled'
    }
    return 'all'
  }, [status])

  const handleStatusTabChange = (tab: 'all' | 'dispatched' | 'draft' | 'cancelled') => {
    if (tab === 'all') {
      onFiltersChange({ ...filters, status: undefined })
    } else {
      onFiltersChange({ ...filters, status: [tab] })
    }
  }

  // Quick Date presets
  const handleQuickDatePreset = (preset: QuickRangePreset) => {
    const today = new Date()
    if (preset === 'all') {
      onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })
      setActivePopover(null)
    } else if (preset === 'today') {
      const todayStr = format(today, 'yyyy-MM-dd')
      onFiltersChange({ ...filters, dateFrom: todayStr, dateTo: todayStr })
      setActivePopover(null)
    } else if (preset === 'week') {
      const weekStart = startOfWeek(today, { weekStartsOn: 1 })
      onFiltersChange({
        ...filters,
        dateFrom: format(weekStart, 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      })
      setActivePopover(null)
    } else if (preset === 'month') {
      const monthStart = startOfMonth(today)
      onFiltersChange({
        ...filters,
        dateFrom: format(monthStart, 'yyyy-MM-dd'),
        dateTo: format(today, 'yyyy-MM-dd'),
      })
      setActivePopover(null)
    } else if (preset === 'last_month') {
      const prevMonth = subMonths(today, 1)
      const prevStart = startOfMonth(prevMonth)
      const prevEnd = endOfMonth(prevMonth)
      onFiltersChange({
        ...filters,
        dateFrom: format(prevStart, 'yyyy-MM-dd'),
        dateTo: format(prevEnd, 'yyyy-MM-dd'),
      })
      setActivePopover(null)
    }
  }

  // Update a single filter field
  const updateFilterField = (field: keyof DispatchFilterType, val: any) => {
    onFiltersChange({
      ...filters,
      [field]: val === '' || (Array.isArray(val) && val.length === 0) ? undefined : val,
    })
  }

  // Toggle multi-select party
  const toggleParty = (id: string) => {
    const updated = partyIds.includes(id)
      ? partyIds.filter((p) => p !== id)
      : [...partyIds, id]
    updateFilterField('partyIds', updated)
  }

  // Toggle multi-select quality
  const toggleQuality = (id: string) => {
    const updated = qualityIds.includes(id)
      ? qualityIds.filter((q) => q !== id)
      : [...qualityIds, id]
    updateFilterField('qualityIds', updated)
  }

  // Reset all filters
  const handleReset = () => {
    setActivePopover(null)
    onFiltersChange({})
  }

  // Calculate active filter count (excluding status tab)
  const activeSecondaryFilterCount = useMemo(() => {
    let count = 0
    if (filters.dateFrom || filters.dateTo) count++
    if (filters.partyIds && filters.partyIds.length > 0) count++
    if (filters.qualityIds && filters.qualityIds.length > 0) count++
    if (filters.lorryNumber) count++
    if (filters.transporter) count++
    if (filters.billNumber) count++
    if (filters.dispatchBillNumber) count++
    if (filters.minWeight !== undefined || filters.maxWeight !== undefined) count++
    return count
  }, [filters])

  const statusTabs: {
    id: 'all' | 'dispatched' | 'draft' | 'cancelled'
    label: string
    count: number
  }[] = [
    { id: 'all', label: 'All Dispatches', count: statusCounts?.all ?? 0 },
    { id: 'dispatched', label: 'Dispatched', count: statusCounts?.dispatched ?? 0 },
    { id: 'draft', label: 'Drafts', count: statusCounts?.draft ?? 0 },
    { id: 'cancelled', label: 'Cancelled', count: statusCounts?.cancelled ?? 0 },
  ]

  return (
    <div className="space-y-2 select-none" ref={filterRailRef}>
      {/* 1. SLIM HORIZONTAL FILTER RAIL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Segmented Status Tabs */}
        <div className="bg-[#F4F5F7] p-1 rounded-xl border border-[#E5E7EB]/80 inline-flex items-center gap-1 max-w-full overflow-x-auto shadow-2xs">
          {statusTabs.map((tab) => {
            const isActive = activeStatusTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleStatusTabChange(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-2 transition-all duration-150 whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-white text-[#111827] shadow-xs font-semibold'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-white/50'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-[10.5px] rounded-full font-mono font-bold transition-colors',
                    isActive
                      ? 'bg-[#111827] text-white'
                      : 'bg-[#E5E7EB] text-[#4B5563]'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right: Popover Action Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs relative">
          {/* Quick Date ▾ */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setActivePopover(activePopover === 'date' ? null : 'date')
              }
              className={cn(
                'h-8 px-3 rounded-lg border font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer',
                dateFrom || dateTo
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-slate-50 hover:text-[#111827]'
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {dateFrom && dateTo
                  ? `${dateFrom} to ${dateTo}`
                  : dateFrom
                  ? `From ${dateFrom}`
                  : dateTo
                  ? `To ${dateTo}`
                  : 'Quick Date'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* Date Popover */}
            {activePopover === 'date' && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-3 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Presets
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'week', label: 'This Week' },
                    { id: 'month', label: 'This Month' },
                    { id: 'last_month', label: 'Last Month' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleQuickDatePreset(p.id as QuickRangePreset)}
                      className="px-2.5 py-1.5 text-xs text-left font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-2 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Custom Range
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                        From
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => updateFilterField('dateFrom', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-[#E5E7EB] rounded-md text-xs font-mono font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-semibold uppercase block mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => updateFilterField('dateTo', e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-[#E5E7EB] rounded-md text-xs font-mono font-medium text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })
                      setActivePopover(null)
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                  >
                    Clear Range
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePopover(null)}
                    className="px-3 py-1 bg-zinc-900 text-white rounded-md text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quality Grade ▾ */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setActivePopover(activePopover === 'quality' ? null : 'quality')
              }
              className={cn(
                'h-8 px-3 rounded-lg border font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer',
                qualityIds.length > 0
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-slate-50 hover:text-[#111827]'
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>
                {qualityIds.length > 0
                  ? `Quality (${qualityIds.length})`
                  : 'Quality Grade'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* Quality Popover */}
            {activePopover === 'quality' && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-3 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Quality Grades
                  </span>
                  {qualityIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => updateFilterField('qualityIds', [])}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                  {(masterQualities || []).map((q) => {
                    const isChecked = qualityIds.includes(q.id)
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => toggleQuality(q.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-left transition-colors cursor-pointer',
                          isChecked
                            ? 'bg-zinc-100 text-zinc-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <span className="truncate">
                          {q.quality_name}{' '}
                          {q.category ? `(${q.category})` : ''}
                        </span>
                        {isChecked && <Check className="h-3.5 w-3.5 text-zinc-900 shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                <div className="border-t border-slate-100 pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActivePopover(null)}
                    className="px-3 py-1 bg-zinc-900 text-white rounded-md text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Carrier / Transporter ▾ */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setActivePopover(activePopover === 'transporter' ? null : 'transporter')
              }
              className={cn(
                'h-8 px-3 rounded-lg border font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer',
                transporter
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-slate-50 hover:text-[#111827]'
              )}
            >
              <Truck className="h-3.5 w-3.5" />
              <span className="truncate max-w-[120px]">
                {transporter ? transporter : 'Transporter'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* Transporter Popover */}
            {activePopover === 'transporter' && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-3 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Transporter Carrier
                  </span>
                  {transporter && (
                    <button
                      type="button"
                      onClick={() => updateFilterField('transporter', '')}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => {
                      updateFilterField('transporter', '')
                      setActivePopover(null)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-left transition-colors cursor-pointer',
                      !transporter
                        ? 'bg-zinc-100 text-zinc-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    <span>All Transporters</span>
                    {!transporter && <Check className="h-3.5 w-3.5 text-zinc-900" />}
                  </button>

                  {transporterList.map((t) => {
                    const isSelected = transporter === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          updateFilterField('transporter', t)
                          setActivePopover(null)
                        }}
                        className={cn(
                          'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-left transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-zinc-100 text-zinc-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <span className="truncate">{t}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-zinc-900 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* More Filters ▾ (Weight range, Party, Purchase bill, Lorry plate) */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setActivePopover(activePopover === 'more' ? null : 'more')
              }
              className={cn(
                'h-8 px-3 rounded-lg border font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer',
                partyIds.length > 0 ||
                  minWeight !== '' ||
                  maxWeight !== '' ||
                  billNumber ||
                  lorryNumber ||
                  dispatchBillNumber
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-[#4B5563] border-[#E5E7EB] hover:bg-slate-50 hover:text-[#111827]'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>More Filters</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {/* More Filters Popover */}
            {activePopover === 'more' && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-[#E5E7EB] p-4 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Additional Constraints
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onFiltersChange({
                        ...filters,
                        partyIds: undefined,
                        lorryNumber: undefined,
                        billNumber: undefined,
                        dispatchBillNumber: undefined,
                        minWeight: undefined,
                        maxWeight: undefined,
                      })
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    Reset Extra
                  </button>
                </div>

                {/* Weight Range */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500 block">
                    Billed Weight Range (MT)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Min MT"
                      value={minWeight}
                      onChange={(e) =>
                        updateFilterField(
                          'minWeight',
                          e.target.value === '' ? undefined : parseFloat(e.target.value)
                        )
                      }
                      className="px-2.5 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-md text-xs font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Max MT"
                      value={maxWeight}
                      onChange={(e) =>
                        updateFilterField(
                          'maxWeight',
                          e.target.value === '' ? undefined : parseFloat(e.target.value)
                        )
                      }
                      className="px-2.5 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-md text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Purchase Bill No & Lorry Plate */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Purchase Bill #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. PB-1047"
                      value={billNumber}
                      onChange={(e) => updateFilterField('billNumber', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-md text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Lorry Plate
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MH 21"
                      value={lorryNumber}
                      onChange={(e) => updateFilterField('lorryNumber', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-md text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Party Multi-Select */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-slate-500 block">
                      Buyers / Parties ({partyIds.length > 0 ? `${partyIds.length} selected` : 'All'})
                    </label>
                    {partyIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => updateFilterField('partyIds', [])}
                        className="text-[10px] text-slate-400 hover:text-slate-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-1 p-1 bg-slate-50 border border-[#E5E7EB] rounded-md scrollbar-thin">
                    {(masterParties || []).map((p) => {
                      const isChecked = partyIds.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleParty(p.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-2 py-1 rounded text-xs text-left transition-colors cursor-pointer',
                            isChecked
                              ? 'bg-zinc-200/80 text-zinc-900 font-bold'
                              : 'hover:bg-slate-200/50 text-slate-700'
                          )}
                        >
                          <span className="truncate">{p.party_name}</span>
                          {isChecked && <Check className="h-3 w-3 text-zinc-900 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActivePopover(null)}
                    className="px-3.5 py-1.5 bg-zinc-900 text-white rounded-md text-xs font-semibold"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset All Trigger */}
          {(activeSecondaryFilterCount > 0 || activeStatusTab !== 'all') && (
            <button
              type="button"
              onClick={handleReset}
              className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-[#4B5563] hover:text-[#111827] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Reset all active filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ACTIVE FILTER CHIPS ROW */}
      {activeSecondaryFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-medium text-slate-400">Active:</span>

          {dateFrom && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#111827] text-[11px] font-medium shadow-2xs">
              <span>From: {dateFrom}</span>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, dateFrom: undefined })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {dateTo && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#111827] text-[11px] font-medium shadow-2xs">
              <span>To: {dateTo}</span>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, dateTo: undefined })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {qualityIds.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#111827] text-[11px] font-medium shadow-2xs">
              <span>
                Quality ({qualityIds.length}):{' '}
                {qualityIds
                  .map((id) => masterQualities.find((q) => q.id === id)?.quality_name || id)
                  .join(', ')}
              </span>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, qualityIds: undefined })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {partyIds.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#111827] text-[11px] font-medium shadow-2xs">
              <span>
                Parties ({partyIds.length}):{' '}
                {partyIds
                  .map((id) => masterParties.find((p) => p.id === id)?.party_name || id)
                  .join(', ')}
              </span>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, partyIds: undefined })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {transporter && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#111827] text-[11px] font-medium shadow-2xs">
              <span>Transporter: {transporter}</span>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, transporter: undefined })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {lorryNumber && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#111827] text-[11px] font-medium shadow-2xs">
              <span>Lorry: {lorryNumber}</span>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, lorryNumber: undefined })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {billNumber && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#111827] text-[11px] font-medium shadow-2xs">
              <span>Bill: {billNumber}</span>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, billNumber: undefined })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {(minWeight !== '' || maxWeight !== '') && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-[#E5E7EB] text-[#111827] text-[11px] font-medium shadow-2xs">
              <span>
                Weight: {minWeight || 0} - {maxWeight || '∞'} MT
              </span>
              <button
                type="button"
                onClick={() =>
                  onFiltersChange({ ...filters, minWeight: undefined, maxWeight: undefined })
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] font-semibold text-zinc-900 hover:underline ml-1 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}

export default DispatchFilters
