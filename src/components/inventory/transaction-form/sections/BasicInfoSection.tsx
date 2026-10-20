import { useState, useRef, useEffect, useMemo } from 'react'
import { Controller, type Control, type UseFormSetValue, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import {
  format,
  isToday,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@lib/utils'
import { FormSection } from '../FormSection'
import { StatusToggle } from '../fields/StatusToggle'
import { SearchableSelect } from '../../SearchableSelect'
import { WeightInputField } from '../../WeightInputField'
import type { TransactionFormData } from '../../TransactionForm'

export interface BasicInfoSectionProps {
  control: Control<TransactionFormData>
  register: UseFormRegister<TransactionFormData>
  setValue: UseFormSetValue<TransactionFormData>
  errors: FieldErrors<TransactionFormData>
  watchedDate: Date
  watchedStatus: 'completed' | 'draft'
  partyOptions: Array<{ value: string; label: string; sublabel?: string; badge?: string }>
  qualityOptions: Array<{ value: string; label: string; sublabel?: string; badge?: string }>
  vehicleOptions: Array<{ value: string; label: string; sublabel?: string; badge?: string }>
  isSaving?: boolean
  onOpenPartyModal: () => void
  onOpenQualityModal: () => void
}

export function BasicInfoSection({
  control,
  register,
  setValue,
  errors,
  watchedDate,
  watchedStatus,
  partyOptions,
  qualityOptions,
  vehicleOptions,
  isSaving = false,
  onOpenPartyModal,
  onOpenQualityModal,
}: BasicInfoSectionProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false)
      }
    }
    if (calendarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [calendarOpen])

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const handleSetToday = () => {
    const today = new Date()
    setValue('transaction_date', today, { shouldValidate: true })
    setCurrentMonth(today)
    setCalendarOpen(false)
  }

  return (
    <FormSection
      title="Step 1: Consignment Source & Inward Receipt"
      subtitle="Supplier details, scrap grade, incoming lorry, and weighbridge inward receipt"
      dotColor="bg-blue-500"
      badgeText="REQUIRED"
      badgeColor="bg-blue-50 text-blue-600 border border-blue-200/60"
    >
      {/* Row 1: Transaction Date (1 col) | Bill No (1 col) | Status (1 col) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Transaction Date Picker */}
        <div className="space-y-1.5" ref={calendarRef}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              TRANSACTION DATE <span className="text-rose-500">*</span>
            </label>
          </div>

          <div className="relative">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                setCurrentMonth(watchedDate || new Date())
                setCalendarOpen(!calendarOpen)
              }}
              className={cn(
                'w-full h-10 px-3 border rounded-lg text-sm flex items-center justify-between transition-colors duration-150 cursor-pointer text-left bg-white',
                calendarOpen
                  ? 'border-indigo-600 ring-2 ring-indigo-100'
                  : 'border-zinc-300 hover:border-zinc-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100',
                isSaving && 'bg-zinc-50 opacity-60 cursor-not-allowed'
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <CalendarIcon className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="text-zinc-900 font-medium text-sm truncate">
                  {watchedDate ? format(watchedDate, 'dd MMM yyyy') : 'Select date'}
                </span>
              </div>
              <span className="text-xs text-zinc-400 font-normal">▼</span>
            </button>

            {/* Calendar Popover */}
            {calendarOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-zinc-200 p-3 w-64 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-800">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-1 rounded-md hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-1 rounded-md hover:bg-zinc-100 text-zinc-600 transition cursor-pointer"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day Names */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d} className="text-[10px] font-bold text-zinc-400">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day) => {
                    const isSelected = watchedDate && isSameDay(day, watchedDate)
                    const isCurrentDay = isToday(day)
                    const isCurrMonth = isSameMonth(day, currentMonth)

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => {
                          setValue('transaction_date', day, { shouldValidate: true })
                          setCalendarOpen(false)
                        }}
                        className={cn(
                          'h-6 w-6 rounded-md text-xs font-medium flex items-center justify-center transition cursor-pointer',
                          !isCurrMonth && 'text-zinc-300',
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                            : isCurrentDay
                            ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                            : 'text-zinc-700 hover:bg-zinc-100'
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>

                {/* Quick Today Button */}
                <div className="pt-2 mt-2 border-t border-zinc-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleSetToday}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  >
                    Set to Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(false)}
                    className="text-[11px] text-zinc-400 hover:text-zinc-600 transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Under-field helper and today link */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-0.5">
            <span className="truncate">
              📅 {watchedDate ? format(watchedDate, 'EEEE, dd MMMM yyyy') : 'No date'}
            </span>
            <button
              type="button"
              onClick={handleSetToday}
              className="text-indigo-600 hover:underline shrink-0 font-medium ml-1 cursor-pointer"
            >
              [Today]
            </button>
          </div>
        </div>

        {/* Bill / Invoice Number */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="bill_number"
              className="text-xs font-semibold text-zinc-500 uppercase tracking-wide"
            >
              BILL / INVOICE NO
            </label>
            <span className="text-xs text-zinc-400 italic">Reference</span>
          </div>

          <input
            id="bill_number"
            type="text"
            disabled={isSaving}
            placeholder="e.g. INV-2026-1051"
            {...register('bill_number')}
            className="w-full h-10 px-3 border border-zinc-300 rounded-lg text-sm text-zinc-900 placeholder:text-zinc-400 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 transition-colors duration-150 disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed"
          />

          <p className="text-xs text-zinc-400">Leave blank to auto-generate</p>
        </div>

        {/* Record Status Toggle */}
        <StatusToggle
          value={watchedStatus}
          onChange={(val) => setValue('status', val, { shouldValidate: true })}
          disabled={isSaving}
        />
      </div>

      {/* Row 2: From Party & Quality */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* From Party Dropdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              FROM PARTY <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-zinc-400 italic">Supplier Account</span>
          </div>

          <Controller
            name="party_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={partyOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select vendor / supplier..."
                searchPlaceholder="Search party name, code, city..."
                error={errors.party_id?.message}
                disabled={isSaving}
                footerLink={{
                  label: '+ Register New Party Profile',
                  onClick: onOpenPartyModal,
                }}
              />
            )}
          />
        </div>

        {/* Quality / Grade Dropdown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              QUALITY / GRADE <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-zinc-400 italic">Material Spec</span>
          </div>

          <Controller
            name="quality_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={qualityOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select scrap grade / technical spec..."
                searchPlaceholder="Search grade name, code, category..."
                error={errors.quality_id?.message}
                disabled={isSaving}
                footerLink={{
                  label: '+ Configure New Commodity Grade',
                  onClick: onOpenQualityModal,
                }}
              />
            )}
          />
        </div>
      </div>

      {/* Row 3: Lorry Number (In) & Inward Weight (MT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lorry Number (In) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              INWARD LORRY NUMBER
            </label>
            <span className="text-xs text-zinc-400 italic">Incoming Carrier</span>
          </div>

          <Controller
            name="vehicle_in_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={vehicleOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="e.g. MH 12 EW 4171 (search or type)..."
                searchPlaceholder="Search lorry plate or type new number..."
                allowCustom={true}
                disabled={isSaving}
              />
            )}
          />
        </div>

        {/* Inward Weight */}
        <div>
          <Controller
            name="inward_weight"
            control={control}
            render={({ field }) => (
              <WeightInputField
                label="INWARD WEIGHT"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.inward_weight?.message}
                disabled={isSaving}
                placeholder="0.000"
                hint="Supplier weighbridge net receipt"
              />
            )}
          />
        </div>
      </div>
    </FormSection>
  )
}

export default BasicInfoSection
