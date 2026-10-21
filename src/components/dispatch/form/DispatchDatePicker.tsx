import { useState, useMemo, useRef, useEffect } from 'react'
import {
  format,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  subDays,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isToday,
} from 'date-fns'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@lib/utils'

export interface DispatchDatePickerProps {
  label?: string
  required?: boolean
  value: string
  onChange: (dateStr: string) => void
  error?: string
  className?: string
}

export function DispatchDatePicker({
  label = 'DATE',
  required = true,
  value,
  onChange,
  error,
  className,
}: DispatchDatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const dateValue = useMemo(() => {
    try {
      if (!value) return new Date()
      const d = new Date(value)
      return isNaN(d.getTime()) ? new Date() : d
    } catch {
      return new Date()
    }
  }, [value])

  const [currentMonth, setCurrentMonth] = useState<Date>(dateValue)

  useEffect(() => {
    setCurrentMonth(dateValue)
  }, [dateValue])

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

  const today = useMemo(() => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }), [])

  const isNextMonthInFuture = useMemo(() => {
    const nextMonthStart = startOfMonth(addMonths(currentMonth, 1))
    return nextMonthStart.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) > today
  }, [currentMonth, today])

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const formattedDisplay = useMemo(() => {
    try {
      return format(dateValue, 'EEEE, dd MMM yyyy')
    } catch {
      return value
    }
  }, [dateValue, value])

  const handleSelectDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    if (dateStr > today) {
      return
    }
    onChange(dateStr)
    setOpen(false)
  }

  return (
    <div ref={ref} className={cn('space-y-1.5 relative select-none', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            const initialPickerDate = dateValue && dateValue.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }) <= today
              ? dateValue
              : new Date()
            setCurrentMonth(initialPickerDate)
            setOpen(!open)
          }}
          className={cn(
            'w-full h-10 px-3 border rounded-lg flex items-center justify-between transition-colors bg-white cursor-pointer focus:outline-none text-sm',
            error
              ? 'border-red-300 ring-2 ring-red-500/10'
              : open
              ? 'border-indigo-400 ring-2 ring-indigo-500/20'
              : 'border-slate-300 hover:border-indigo-300'
          )}
        >
          <div className="flex items-center gap-2.5 truncate">
            <CalendarDays className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-900 truncate">
              {formattedDisplay}
            </span>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            {format(dateValue, 'dd/MM/yyyy')}
          </span>
        </button>

        {/* Quick Date Chips below */}
        <div className="flex items-center gap-2 mt-1.5 text-xs">
          <button
            type="button"
            onClick={() => handleSelectDate(new Date())}
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded cursor-pointer transition-colors',
              isSameDay(dateValue, new Date())
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-indigo-600 hover:underline'
            )}
          >
            Today
          </button>
          <span className="text-slate-300">&bull;</span>
          <button
            type="button"
            onClick={() => handleSelectDate(subDays(new Date(), 1))}
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded cursor-pointer transition-colors',
              isSameDay(dateValue, subDays(new Date(), 1))
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-indigo-600 hover:underline'
            )}
          >
            Yesterday
          </button>
        </div>

        {/* Popover Calendar */}
        {open && (
          <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-68 animate-in fade-in zoom-in-95 duration-150">
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
                  disabled={isNextMonthInFuture}
                  onClick={() => !isNextMonthInFuture && setCurrentMonth(addMonths(currentMonth, 1))}
                  className={cn(
                    'p-1 rounded-md transition',
                    isNextMonthInFuture
                      ? 'opacity-30 cursor-not-allowed pointer-events-none text-slate-300'
                      : 'hover:bg-slate-100 text-slate-600 cursor-pointer'
                  )}
                  title={isNextMonthInFuture ? 'Future months are disabled' : 'Next month'}
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
                const dayStr = day.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
                const isFuture = dayStr > today
                const isSelected = isSameDay(day, dateValue)
                const isCurrentDay = isToday(day)
                const isCurrMonth = isSameMonth(day, currentMonth)

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={isFuture}
                    onClick={() => {
                      if (isFuture) return
                      handleSelectDate(day)
                    }}
                    className={cn(
                      'h-7 w-7 rounded-md text-xs font-medium flex items-center justify-center transition',
                      isFuture
                        ? 'text-gray-300 cursor-not-allowed pointer-events-none opacity-40 select-none'
                        : !isCurrMonth
                        ? 'text-slate-300 hover:bg-slate-100 cursor-pointer'
                        : isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-2xs cursor-pointer'
                        : isCurrentDay
                        ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 cursor-pointer'
                        : 'text-slate-700 hover:bg-slate-100 cursor-pointer'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>

            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleSelectDate(new Date())}
                className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  )
}

export default DispatchDatePicker
