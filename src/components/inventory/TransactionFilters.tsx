import { useState, useMemo, useRef, useEffect } from 'react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  isSameDay,
  isSameMonth,
  addMonths,
  eachDayOfInterval,
  isToday,
} from 'date-fns'
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
} from 'lucide-react'
import { useParties, useQualities, useGodowns } from '@hooks/useMasterData'
import type { TransactionFilters as FilterType } from '@hooks/useInventory'
import { cn } from '@lib/utils'

export interface TransactionFiltersProps {
  filters: FilterType
  onFilterChange: (filters: FilterType) => void
  onReset: () => void
  totalResultsCount?: number
  className?: string
}

/* ─────────────────────────────────────────────────────────────
   MULTI-SELECT DROPDOWN
   ───────────────────────────────────────────────────────────── */
interface MultiSelectDropdownProps {
  label: string
  placeholder: string
  options: { value: string; label: string; sublabel?: string }[]
  selectedValues: string[]
  onChange: (values: string[]) => void
}

function MultiSelectDropdown({
  placeholder,
  options,
  selectedValues = [],
  onChange,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase().trim()
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    )
  }, [options, search])

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val))
    } else {
      onChange([...selectedValues, val])
    }
  }

  const selectedCount = selectedValues.length

  return (
    <div ref={dropdownRef} className="relative select-none w-full sm:w-44">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full h-9 flex items-center justify-between px-3 text-xs rounded-lg border bg-white transition-colors cursor-pointer focus:outline-none',
          selectedCount > 0
            ? 'border-blue-500 bg-blue-50/20 text-blue-900 font-semibold'
            : 'border-slate-300 hover:border-slate-400 text-slate-700'
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedCount > 0 ? (
            <span className="inline-flex items-center gap-1">
              <span className="bg-blue-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                {selectedCount}
              </span>
              <span className="truncate">
                {selectedCount === 1
                  ? options.find((o) => o.value === selectedValues[0])?.label
                  : `${selectedCount} selected`}
              </span>
            </span>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-blue-600'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-60 animate-in fade-in zoom-in-95 duration-150 min-w-[200px]">
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-7.5 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1 divide-y divide-slate-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value)
                return (
                  <div
                    key={opt.value}
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition select-none',
                      isSelected
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div
                        className={cn(
                          'h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors shrink-0',
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                      <span className="truncate">{opt.label}</span>
                    </div>

                    {opt.sublabel && (
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">No options found</div>
            )}
          </div>

          {selectedCount > 0 && (
            <div className="p-1.5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedCount} selected
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer font-semibold"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   CUSTOM DATE PICKER POPOVER
   ───────────────────────────────────────────────────────────── */
interface DatePickerPopoverProps {
  label: string
  value?: Date | string
  onChange: (date?: Date) => void
  placeholder?: string
}

function DatePickerPopover({
  label,
  value,
  onChange,
  placeholder = 'Select date',
}: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false)
  const parsedValue = value ? (value instanceof Date ? value : new Date(value)) : undefined
  const [currentMonth, setCurrentMonth] = useState(parsedValue || new Date())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  return (
    <div ref={ref} className="space-y-1 relative select-none">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setCurrentMonth(parsedValue || new Date())
            setOpen(!open)
          }}
          className={cn(
            'w-full h-9 px-3 border rounded-lg text-xs flex items-center justify-between transition-colors bg-white cursor-pointer focus:outline-none',
            open
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-slate-300 hover:border-slate-400'
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className={cn('truncate', parsedValue ? 'text-slate-800 font-medium' : 'text-slate-400')}>
              {parsedValue ? format(parsedValue, 'dd/MM/yyyy') : placeholder}
            </span>
          </div>

          {parsedValue && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                onChange(undefined)
              }}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-64 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span key={d} className="text-[10px] font-bold text-slate-400">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isSelected = parsedValue && isSameDay(day, parsedValue)
                const isCurrentDay = isToday(day)
                const isCurrMonth = isSameMonth(day, currentMonth)

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      onChange(day)
                      setOpen(false)
                    }}
                    className={cn(
                      'h-6 w-6 rounded-md text-xs font-medium flex items-center justify-center transition cursor-pointer',
                      !isCurrMonth && 'text-slate-300',
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : isCurrentDay
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onChange(new Date())
                  setOpen(false)
                }}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   MAIN TRANSACTION FILTERS COMPONENT
   ───────────────────────────────────────────────────────────── */
export function TransactionFilters({
  filters,
  onFilterChange,
  onReset,
  className,
}: TransactionFiltersProps) {
  const { parties } = useParties()
  const { qualities } = useQualities()
  const { godowns } = useGodowns()

  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  // Status checkboxes state: defaults to all 3 enabled
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => {
    return filters.status && filters.status.length > 0
      ? filters.status
      : ['completed', 'draft', 'cancelled']
  })

  // Advanced fields local state
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? (filters.dateFrom instanceof Date ? filters.dateFrom : new Date(filters.dateFrom)) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? (filters.dateTo instanceof Date ? filters.dateTo : new Date(filters.dateTo)) : undefined
  )
  const [godownId, setGodownId] = useState<string>(
    filters.godownIds && filters.godownIds.length > 0 ? filters.godownIds[0] : ''
  )
  const [minWeight, setMinWeight] = useState<string>(
    filters.minWeight !== undefined ? String(filters.minWeight) : ''
  )
  const [maxWeight, setMaxWeight] = useState<string>(
    filters.maxWeight !== undefined ? String(filters.maxWeight) : ''
  )
  const [billNumber, setBillNumber] = useState<string>(filters.billNumber || '')
  const [lorryNumber, setLorryNumber] = useState<string>(filters.lorryNumber || '')

  // Sync external filters changes
  useEffect(() => {
    setSearchQuery(filters.search || '')
    setDateFrom(
      filters.dateFrom ? (filters.dateFrom instanceof Date ? filters.dateFrom : new Date(filters.dateFrom)) : undefined
    )
    setDateTo(
      filters.dateTo ? (filters.dateTo instanceof Date ? filters.dateTo : new Date(filters.dateTo)) : undefined
    )
    setGodownId(filters.godownIds && filters.godownIds.length > 0 ? filters.godownIds[0] : '')
    setMinWeight(filters.minWeight !== undefined ? String(filters.minWeight) : '')
    setMaxWeight(filters.maxWeight !== undefined ? String(filters.maxWeight) : '')
    setBillNumber(filters.billNumber || '')
    setLorryNumber(filters.lorryNumber || '')
    if (filters.status && filters.status.length > 0) {
      setSelectedStatuses(filters.status)
    }
  }, [filters])

  // Count active filters (for badge)
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.partyIds && filters.partyIds.length > 0) count += filters.partyIds.length
    if (filters.qualityIds && filters.qualityIds.length > 0) count += filters.qualityIds.length
    if (filters.godownIds && filters.godownIds.length > 0) count += filters.godownIds.length
    if (filters.dateFrom || filters.dateTo) count++
    if (filters.minWeight !== undefined || filters.maxWeight !== undefined) count++
    if (filters.billNumber) count++
    if (filters.lorryNumber) count++
    if (filters.status && filters.status.length < 3) count++
    return count
  }, [filters])

  // Options mapping
  const partyOptions = useMemo(() => {
    return parties.map((p) => ({
      value: p.id,
      label: p.party_name,
      sublabel: p.party_code,
    }))
  }, [parties])

  const qualityOptions = useMemo(() => {
    return qualities.map((q) => ({
      value: q.id,
      label: q.quality_name,
      sublabel: q.quality_code,
    }))
  }, [qualities])

  const godownOptions = useMemo(() => {
    return godowns.map((g) => ({
      value: g.id,
      label: g.godown_name,
      sublabel: g.godown_code,
    }))
  }, [godowns])

  // Handlers for Quick Bar
  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    onFilterChange({
      ...filters,
      search: val.trim() || undefined,
    })
  }

  const handlePartyChange = (selected: string[]) => {
    onFilterChange({
      ...filters,
      partyIds: selected.length > 0 ? selected : undefined,
    })
  }

  const handleQualityChange = (selected: string[]) => {
    onFilterChange({
      ...filters,
      qualityIds: selected.length > 0 ? selected : undefined,
    })
  }

  const handleDatePreset = (preset: 'today' | 'this_week' | 'this_month' | 'last_month') => {
    const now = new Date()
    let from: Date
    let to: Date

    if (preset === 'today') {
      from = now
      to = now
    } else if (preset === 'this_week') {
      from = startOfWeek(now, { weekStartsOn: 1 })
      to = endOfWeek(now, { weekStartsOn: 1 })
    } else if (preset === 'this_month') {
      from = startOfMonth(now)
      to = endOfMonth(now)
    } else {
      const lastMonth = subMonths(now, 1)
      from = startOfMonth(lastMonth)
      to = endOfMonth(lastMonth)
    }

    setActiveDatePreset(preset)
    setDateFrom(from)
    setDateTo(to)
    onFilterChange({
      ...filters,
      dateFrom: from,
      dateTo: to,
    })
  }

  const handleStatusToggle = (status: string) => {
    let next: string[]
    if (selectedStatuses.includes(status)) {
      if (selectedStatuses.length === 1) return // Keep at least one selected
      next = selectedStatuses.filter((s) => s !== status)
    } else {
      next = [...selectedStatuses, status]
    }
    setSelectedStatuses(next)

    onFilterChange({
      ...filters,
      status: next.length < 3 ? next : undefined,
    })
  }

  // Apply advanced filters
  const handleApplyAdvanced = () => {
    onFilterChange({
      ...filters,
      dateFrom: dateFrom,
      dateTo: dateTo,
      godownIds: godownId ? [godownId] : undefined,
      minWeight: minWeight ? parseFloat(minWeight) : undefined,
      maxWeight: maxWeight ? parseFloat(maxWeight) : undefined,
      billNumber: billNumber.trim() || undefined,
      lorryNumber: lorryNumber.trim() || undefined,
    })
  }

  const handleResetAll = () => {
    setSearchQuery('')
    setActiveDatePreset(null)
    setSelectedStatuses(['completed', 'draft', 'cancelled'])
    setDateFrom(undefined)
    setDateTo(undefined)
    setGodownId('')
    setMinWeight('')
    setMaxWeight('')
    setBillNumber('')
    setLorryNumber('')
    onReset()
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-xs px-4 sm:px-5 py-4 space-y-3 select-none',
        className
      )}
    >
      {/* ─────────────────────────────────────────────────────────────
          LAYER 1: ALWAYS-VISIBLE QUICK FILTER BAR
          ───────────────────────────────────────────────────────────── */}
      {/* Row 1: Search + Party + Quality */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search party, bill no, lorry plate..."
            className="w-full h-9 pl-9 pr-8 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Party MultiSelect Dropdown */}
        <MultiSelectDropdown
          label="Party"
          placeholder="All Parties"
          options={partyOptions}
          selectedValues={filters.partyIds || []}
          onChange={handlePartyChange}
        />

        {/* Quality MultiSelect Dropdown */}
        <MultiSelectDropdown
          label="Quality"
          placeholder="All Grades"
          options={qualityOptions}
          selectedValues={filters.qualityIds || []}
          onChange={handleQualityChange}
        />
      </div>

      {/* Row 2: Date Presets & More Filters Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Date Presets */}
        <div className="inline-flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium uppercase mr-1 hidden sm:inline">
            DATE:
          </span>

          <button
            type="button"
            onClick={() => handleDatePreset('today')}
            className={cn(
              'text-xs px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer font-medium',
              activeDatePreset === 'today'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => handleDatePreset('this_week')}
            className={cn(
              'text-xs px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer font-medium',
              activeDatePreset === 'this_week'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            This Week
          </button>

          <button
            type="button"
            onClick={() => handleDatePreset('this_month')}
            className={cn(
              'text-xs px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer font-medium',
              activeDatePreset === 'this_month'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            This Month
          </button>

          <button
            type="button"
            onClick={() => handleDatePreset('last_month')}
            className={cn(
              'text-xs px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer font-medium',
              activeDatePreset === 'last_month'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            Last Month
          </button>

          {/* Clear Date Preset chip */}
          {activeDatePreset && (
            <button
              type="button"
              onClick={() => {
                setActiveDatePreset(null)
                setDateFrom(undefined)
                setDateTo(undefined)
                onFilterChange({
                  ...filters,
                  dateFrom: undefined,
                  dateTo: undefined,
                })
              }}
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline px-2 py-1 cursor-pointer font-medium"
            >
              <span>Clear Date</span>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* More Filters Toggle */}
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer',
            advancedOpen || activeFilterCount > 0
              ? 'bg-blue-50 text-blue-700 border-blue-300'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
          <span>More Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200',
              advancedOpen && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* Row 3: Status Quick Toggles */}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-100">
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          STATUS:
        </span>

        {/* Completed Checkbox */}
        <label
          onClick={() => handleStatusToggle('completed')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer"
        >
          <div
            className={cn(
              'h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors',
              selectedStatuses.includes('completed')
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 bg-white'
            )}
          >
            {selectedStatuses.includes('completed') && <Check className="h-2.5 w-2.5 stroke-[3]" />}
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Completed</span>
        </label>

        {/* Draft Checkbox */}
        <label
          onClick={() => handleStatusToggle('draft')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer"
        >
          <div
            className={cn(
              'h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors',
              selectedStatuses.includes('draft')
                ? 'bg-amber-600 border-amber-600 text-white'
                : 'border-slate-300 bg-white'
            )}
          >
            {selectedStatuses.includes('draft') && <Check className="h-2.5 w-2.5 stroke-[3]" />}
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>Draft</span>
        </label>

        {/* Cancelled Checkbox */}
        <label
          onClick={() => handleStatusToggle('cancelled')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer"
        >
          <div
            className={cn(
              'h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors',
              selectedStatuses.includes('cancelled')
                ? 'bg-red-600 border-red-600 text-white'
                : 'border-slate-300 bg-white'
            )}
          >
            {selectedStatuses.includes('cancelled') && <Check className="h-2.5 w-2.5 stroke-[3]" />}
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>Cancelled</span>
        </label>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 2: EXPANDABLE ADVANCED FILTERS
          ───────────────────────────────────────────────────────────── */}
      {advancedOpen && (
        <div className="pt-3 mt-3 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ADVANCED FILTER PARAMETERS
            </span>
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-600 transition cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset All</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date From */}
            <DatePickerPopover
              label="DATE FROM"
              value={dateFrom}
              onChange={setDateFrom}
              placeholder="dd/mm/yyyy"
            />

            {/* Date To */}
            <DatePickerPopover
              label="DATE TO"
              value={dateTo}
              onChange={setDateTo}
              placeholder="dd/mm/yyyy"
            />

            {/* Godown Selection */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                GODOWN / YARD
              </label>
              <select
                value={godownId}
                onChange={(e) => setGodownId(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="">All Godowns &amp; Yards</option>
                {godownOptions.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label} ({g.sublabel})
                  </option>
                ))}
              </select>
            </div>

            {/* Inward Weight Range */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                WEIGHT RANGE (INWARD MT)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min MT"
                  value={minWeight}
                  onChange={(e) => setMinWeight(e.target.value)}
                  className="w-full h-9 px-2.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="text-xs text-slate-400">to</span>
                <input
                  type="number"
                  placeholder="Max MT"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(e.target.value)}
                  className="w-full h-9 px-2.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bill / Invoice Number */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                BILL / INVOICE NO
              </label>
              <input
                type="text"
                placeholder="e.g. INV-2026-1051"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Lorry Plate Search */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                LORRY PLATE (IN / OUT)
              </label>
              <input
                type="text"
                placeholder="e.g. MH 12 EW 4171"
                value={lorryNumber}
                onChange={(e) => setLorryNumber(e.target.value)}
                className="w-full h-9 px-3 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons for Advanced */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetAll}
              className="text-xs text-slate-500 hover:text-red-600 font-medium transition cursor-pointer"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={handleApplyAdvanced}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          ACTIVE FILTER CHIPS ROW
          ───────────────────────────────────────────────────────────── */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-semibold uppercase mr-1">
            ACTIVE FILTERS:
          </span>

          {filters.partyIds && filters.partyIds.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <span>
                Party:{' '}
                {filters.partyIds.length === 1
                  ? partyOptions.find((p) => p.value === filters.partyIds![0])?.label || filters.partyIds[0]
                  : `${filters.partyIds.length} parties`}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, partyIds: undefined })}
                className="hover:text-blue-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.qualityIds && filters.qualityIds.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              <span>
                Quality:{' '}
                {filters.qualityIds.length === 1
                  ? qualityOptions.find((q) => q.value === filters.qualityIds![0])?.label || filters.qualityIds[0]
                  : `${filters.qualityIds.length} grades`}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, qualityIds: undefined })}
                className="hover:text-purple-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.godownIds && filters.godownIds.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <span>
                Godown:{' '}
                {godownOptions.find((g) => g.value === filters.godownIds![0])?.label || filters.godownIds[0]}
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, godownIds: undefined })}
                className="hover:text-amber-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {(filters.dateFrom || filters.dateTo) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span>
                Date:{' '}
                {filters.dateFrom
                  ? format(filters.dateFrom instanceof Date ? filters.dateFrom : new Date(filters.dateFrom), 'dd/MM/yy')
                  : 'Start'}{' '}
                &minus;{' '}
                {filters.dateTo
                  ? format(filters.dateTo instanceof Date ? filters.dateTo : new Date(filters.dateTo), 'dd/MM/yy')
                  : 'End'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveDatePreset(null)
                  onFilterChange({ ...filters, dateFrom: undefined, dateTo: undefined })
                }}
                className="hover:text-slate-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {(filters.minWeight !== undefined || filters.maxWeight !== undefined) && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span>
                Weight: {filters.minWeight || 0} &minus; {filters.maxWeight || '∞'} MT
              </span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, minWeight: undefined, maxWeight: undefined })}
                className="hover:text-slate-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.billNumber && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span>Bill: {filters.billNumber}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, billNumber: undefined })}
                className="hover:text-slate-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.lorryNumber && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span>Lorry: {filters.lorryNumber}</span>
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, lorryNumber: undefined })}
                className="hover:text-slate-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetAll}
            className="text-[11px] font-semibold text-blue-600 hover:underline ml-1 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  )
}

export default TransactionFilters
