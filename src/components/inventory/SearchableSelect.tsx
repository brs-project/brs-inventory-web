import { useState, useRef, useEffect, useMemo } from 'react'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import { cn } from '@lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
  sublabel?: string
  badge?: string
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder?: string
  allowCustom?: boolean
  footerLink?: {
    label: string
    onClick: () => void
  }
  disabled?: boolean
  error?: string
  required?: boolean
  className?: string
  id?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Search...',
  allowCustom = false,
  footerLink,
  disabled = false,
  error,
  className,
  id,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Find currently selected option object if present in options list
  const safeOptions = useMemo(() => options || [], [options])

  // Find currently selected option object if present in options list
  const selectedOption = useMemo(() => {
    return safeOptions.find((opt) => opt && opt.value === value)
  }, [safeOptions, value])

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return safeOptions
    const q = searchQuery.toLowerCase().trim()
    return safeOptions.filter(
      (opt) =>
        opt && (
          (opt.label && opt.label.toLowerCase().includes(q)) ||
          (opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
          (opt.badge && opt.badge.toLowerCase().includes(q)) ||
          (opt.value && opt.value.toLowerCase().includes(q))
        )
    )
  }, [safeOptions, searchQuery])

  // Determine whether custom value option should be visible
  const showCustomOption = useMemo(() => {
    if (!allowCustom || !searchQuery.trim()) return false
    const exactMatch = safeOptions.some(
      (opt) =>
        opt && (
          (opt.label && opt.label.toLowerCase() === searchQuery.toLowerCase().trim()) ||
          (opt.value && opt.value.toLowerCase() === searchQuery.toLowerCase().trim())
        )
    )
    return !exactMatch
  }, [allowCustom, searchQuery, safeOptions])

  // Total items in navigation list (filtered options + optional custom item)
  const totalNavItems = filteredOptions.length + (showCustomOption ? 1 : 0)

  // Auto focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setHighlightedIndex(0)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelectOption = (optValue: string) => {
    onChange(optValue)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleSelectCustom = () => {
    const trimmed = searchQuery.trim().toUpperCase()
    if (trimmed) {
      onChange(trimmed)
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev + 1 < totalNavItems ? prev + 1 : 0))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalNavItems - 1))
        break
      case 'Enter':
        e.preventDefault()
        if (showCustomOption && highlightedIndex === filteredOptions.length) {
          handleSelectCustom()
        } else if (filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex].value)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      case 'Tab':
        setIsOpen(false)
        break
    }
  }

  return (
    <div ref={containerRef} className={cn('relative w-full select-none', className)}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'w-full h-10 flex items-center justify-between gap-2 px-3 text-sm rounded-lg border bg-white transition-colors duration-150 text-left cursor-pointer focus:outline-none',
          error
            ? 'border-red-300 bg-red-50/20 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
            : isOpen
            ? 'border-blue-500 bg-white ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50'
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-slate-900 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-xs text-slate-500 truncate">
                  ({selectedOption.sublabel})
                </span>
              )}
              {selectedOption.badge && (
                <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : value ? (
            /* Custom typed value */
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm tracking-wider">
                {value}
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.2 rounded">
                Custom
              </span>
            </div>
          ) : (
            <span className="text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              title="Clear selection"
              className="p-1 rounded-md hover:bg-slate-200/70 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              isOpen && 'rotate-180 text-blue-600'
            )}
          />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-72">
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setHighlightedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8.5 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            className="overflow-y-auto p-1.5 space-y-0.5 flex-1 divide-y divide-slate-50"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value
                const isHighlighted = highlightedIndex === index

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition select-none',
                      isSelected
                        ? 'bg-blue-50/80 text-blue-900 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100/90 text-slate-900'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="text-[11px] text-slate-400 truncate">
                          {opt.sublabel}
                        </span>
                      )}
                      {opt.badge && (
                        <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700">
                          {opt.badge}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600 shrink-0" />
                    )}
                  </li>
                )
              })
            ) : !showCustomOption ? (
              <li className="py-6 text-center text-xs text-slate-400">
                No matching options found
              </li>
            ) : null}

            {/* Custom Option Item */}
            {showCustomOption && (
              <li
                role="option"
                aria-selected={false}
                onClick={handleSelectCustom}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm cursor-pointer transition select-none text-blue-600 border border-dashed border-blue-200 bg-blue-50/40',
                  highlightedIndex === filteredOptions.length && 'bg-blue-100/60 font-semibold'
                )}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  Use custom entry: <strong className="font-mono">{searchQuery.trim().toUpperCase()}</strong>
                </span>
              </li>
            )}
          </ul>

          {/* Footer Action Link */}
          {footerLink && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/90 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setIsOpen(false)
                  footerLink.onClick()
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50/80 rounded-lg transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{footerLink.label}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium animate-in fade-in duration-150">
          {error}
        </p>
      )}
    </div>
  )
}

export default SearchableSelect
