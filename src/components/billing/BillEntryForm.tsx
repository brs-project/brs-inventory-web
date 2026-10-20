const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
import { useState, useEffect, useMemo, useId } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import {
  RotateCcw,
  Loader2,
  FileText,
  Receipt,
  Scale,
  Lock,
  X,
  Building2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useVehicles } from '@hooks/useMasterData'
import supabase from '@/services/supabaseClient'
import { calculateBillEntry, formatKG } from '@lib/billCalculations'
import { SearchableSelect, type SearchableSelectOption } from '@components/inventory/SearchableSelect'
import { BillDatePicker } from './form/BillDatePicker'
import { RateInputField } from './form/RateInputField'
import { DraftRestoreBanner } from './form/DraftRestoreBanner'
import { PaymentStatusSelect, type PaymentStatusType } from './form/PaymentStatusSelect'
import { BillCalculationPanel } from './calculation/BillCalculationPanel'
import { MobileCalcCollapsible } from './MobileCalcCollapsible'
import { cn } from '@lib/utils'
import type { BillEntry } from '@types'

const DRAFT_KEY = 'brs_bill_entry_draft_v2'

const billFormSchema = z.object({
  bill_date: z.string().min(1, 'Date is required'),
  bill_number: z.string().optional(),
  party_code: z.string().min(1, 'Party code is required'),
  party_id: z.string().min(1, 'Please select a valid party'),
  quality_id: z.string().min(1, 'Quality is required'),
  lorry_number: z.string().min(1, 'Lorry number is required'),
  quantity_mt: z
    .number()
    .positive('Quantity must be greater than 0')
    .max(100, 'Quantity cannot exceed 100 MT'),
  bill_rate: z
    .number()
    .nonnegative('Bill rate cannot be negative')
    .max(1000, 'Invalid rate amount'),
  actual_rate: z
    .number()
    .nonnegative('Actual rate cannot be negative')
    .max(1000, 'Invalid rate amount'),
  payment_status: z.enum(['pending', 'paid', 'partial', 'na']),
  rtgs_reference: z.string().optional(),
  remarks: z.string().max(300, 'Remarks cannot exceed 300 characters').optional(),
})

export type BillFormData = z.infer<typeof billFormSchema>

export interface BillEntryFormProps {
  initialData?: BillEntry
  onSubmit: (
    data: Omit<
      BillEntry,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'rate_difference'
      | 'rtgs_amount'
      | 'quantity_kg'
      | 'billing_type'
      | 'parties'
      | 'qualities'
    > & {
      quality_grade_id?: string
      lorry_no?: string
    }
  ) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export function BillEntryForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BillEntryFormProps) {
  const formId = useId()
  // Dynamically load party & quality options from live Supabase tables
  const [parties, setParties] = useState<
    { id: string; code: string; name: string; types: string[]; gstin: string | null }[]
  >([])
  const [qualities, setQualities] = useState<
    { id: string; name: string; default_rate_per_kg: number }[]
  >([])
  const [isLoadingMasterData, setIsLoadingMasterData] = useState<boolean>(true)
  const { vehicles: masterVehicles } = useVehicles()

  useEffect(() => {
    let isMounted = true
    async function loadDynamicDropdowns() {
      setIsLoadingMasterData(true)
      try {
        const [partiesRes, qualitiesRes] = await Promise.all([
          supabase.from('parties').select('id, code, name, types, gstin').order('name'),
          supabase.from('quality_grades').select('id, name, default_rate_per_kg').order('name'),
        ])

        if (partiesRes.error) throw partiesRes.error
        if (qualitiesRes.error) throw qualitiesRes.error

        if (isMounted) {
          setParties((partiesRes.data as any) || [])
          setQualities((qualitiesRes.data as any) || [])
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to load master dropdown options'
        toast.error(msg)
      } finally {
        if (isMounted) setIsLoadingMasterData(false)
      }
    }

    loadDynamicDropdowns()
    return () => {
      isMounted = false
    }
  }, [])
  // dispatchesList removed
  const [, setDispatchesList] = useState<{ id: string; outward_bill_no: string; lorry_no: string }[]>([])

  useEffect(() => {
    supabase.from('dispatch_records').select('id, outward_bill_no, lorry_no').then(({ data }) => {
      if (data) setDispatchesList(data)
    })
  }, [])
  const [hasDraft, setHasDraft] = useState<boolean>(false)
  const [lastDraftSaved, setLastDraftSaved] = useState<string | null>(null)
  const [clearDialogOpen, setClearDialogOpen] = useState<boolean>(false)

  const defaultValues: BillFormData = useMemo(() => {
    if (initialData) {
      return {
        bill_date: initialData.bill_date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
        bill_number: initialData.bill_number || '',
        party_code: initialData.party_code || '',
        party_id: initialData.party_id || '',
        quality_id: initialData.quality_id || '',
        lorry_number: initialData.lorry_number || '',
        quantity_mt: initialData.quantity_mt ?? ('' as any),
        bill_rate: initialData.bill_rate ?? ('' as any),
        actual_rate: initialData.actual_rate ?? ('' as any),
        payment_status: initialData.payment_status || 'pending',
        rtgs_reference: initialData.rtgs_reference || '',
        remarks: initialData.remarks || '',
      }
    }
    return {
      bill_date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
      bill_number: '',
      party_code: '',
      party_id: '',
      quality_id: '',
      lorry_number: '',
      quantity_mt: '' as any,
      bill_rate: '' as any,
      actual_rate: '' as any,
      payment_status: 'pending',
      rtgs_reference: '',
      remarks: '',
    }
  }, [initialData])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    defaultValues,
  })

  // Check for saved draft on mount
  useEffect(() => {
    if (!initialData) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            setHasDraft(true)
          }
        }
      } catch {
        // ignore
      }
    }
  }, [initialData])

  // Auto-save draft every 30 seconds
  const currentValues = watch()
  useEffect(() => {
    if (initialData) return

    const timer = setInterval(() => {
      const hasContent =
        currentValues.party_id ||
        currentValues.party_code ||
        currentValues.quality_id ||
        currentValues.lorry_number ||
        currentValues.quantity_mt ||
        currentValues.bill_rate ||
        currentValues.actual_rate ||
        currentValues.remarks

      if (hasContent && isDirty) {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(currentValues))
          setLastDraftSaved(format(new Date(), 'HH:mm:ss'))
        } catch {
          // ignore
        }
      }
    }, 30000)

    return () => clearInterval(timer)
  }, [currentValues, isDirty, initialData])

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        reset(parsed)
        setHasDraft(false)
        toast.success('Draft restored successfully')
      }
    } catch {
      toast.error('Failed to restore draft')
    }
  }

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setHasDraft(false)
    toast.info('Draft discarded')
  }

  // Watched fields for live calculations and party synchronization
  const watchedDate = watch('bill_date')
  const watchedPartyId = watch('party_id')
  const watchedPartyCode = watch('party_code')
  const watchedQualityId = watch('quality_id')
  const watchedLorry = watch('lorry_number')
  const watchedQty = watch('quantity_mt')
  const watchedBillRate = watch('bill_rate')
  const watchedActualRate = watch('actual_rate')
  const watchedPaymentStatus = watch('payment_status')

  // Find party object
  const matchedParty = useMemo(() => {
    if (watchedPartyId) {
      return parties.find((p) => p.id === watchedPartyId)
    }
    if (watchedPartyCode) {
      const clean = watchedPartyCode.trim().toUpperCase()
      return parties.find(
        (p) =>
          (p.code || '').toUpperCase() === clean ||
          (p.name || '').toUpperCase().includes(clean)
      )
    }
    return undefined
  }, [watchedPartyId, watchedPartyCode, parties])

  // Sync party_id when party_code is typed
  const handlePartyCodeChange = (code: string) => {
    const clean = code.trim().toUpperCase()
    setValue('party_code', clean, { shouldValidate: true, shouldDirty: true })

    const found = parties.find((p) => (p.code || '').toUpperCase() === clean)
    if (found) {
      setValue('party_id', found.id, { shouldValidate: true, shouldDirty: true })
    }
  }

  // Sync party_code when party is selected from SearchableSelect
  const handlePartySelect = (id: string) => {
    setValue('party_id', id, { shouldValidate: true, shouldDirty: true })
    const p = parties.find((item) => item.id === id)
    if (p?.code) {
      setValue('party_code', p.code, { shouldValidate: true, shouldDirty: true })
    }
  }

  // Auto-populate default rate when quality is selected
  const handleQualitySelect = (id: string) => {
    setValue('quality_id', id, { shouldValidate: true, shouldDirty: true })
    const q = qualities.find((item) => item.id === id)
    if (q && (!watchedActualRate || watchedActualRate === 0)) {
      setValue('actual_rate', Number(q.default_rate_per_kg || 0), {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
  }

  // Live calculations
  const numQty = typeof watchedQty === 'number' && !isNaN(watchedQty) ? watchedQty : 0
  const numBillRate = typeof watchedBillRate === 'number' && !isNaN(watchedBillRate) ? watchedBillRate : 0
  const numActualRate = typeof watchedActualRate === 'number' && !isNaN(watchedActualRate) ? watchedActualRate : 0

  const calculation = useMemo(() => {
    return calculateBillEntry(numQty, numBillRate, numActualRate)
  }, [numQty, numBillRate, numActualRate])

  // Automatically update payment status when exact billing is detected
  useEffect(() => {
    if (calculation.billing_type === 'exact' && watchedPaymentStatus !== 'na') {
      setValue('payment_status', 'na', { shouldDirty: true })
    } else if (
      calculation.billing_type !== 'exact' &&
      watchedPaymentStatus === 'na'
    ) {
      setValue('payment_status', 'pending', { shouldDirty: true })
    }
  }, [calculation.billing_type, watchedPaymentStatus, setValue])

  // Form completion counter
  const filledFieldsCount = useMemo(() => {
    let count = 0
    if (watchedDate) count++
    if (watchedPartyId || watchedPartyCode) count++
    if (watchedQualityId) count++
    if (watchedLorry) count++
    if (typeof watchedQty === 'number' && watchedQty > 0) count++
    if (typeof watchedBillRate === 'number' && watchedBillRate > 0) count++
    if (typeof watchedActualRate === 'number' && watchedActualRate > 0) count++
    if (watchedPaymentStatus) count++
    return count
  }, [
    watchedDate,
    watchedPartyId,
    watchedPartyCode,
    watchedQualityId,
    watchedLorry,
    watchedQty,
    watchedBillRate,
    watchedActualRate,
    watchedPaymentStatus,
  ])

  // Quality & Vehicle Options
  const qualityOptions = useMemo<SearchableSelectOption[]>(
    () =>
      qualities.map((q) => ({
        value: q.id,
        label: q.name,
        sublabel: `Default Rate: ₹${Number(q.default_rate_per_kg || 0).toFixed(2)}/kg`,
        badge: `₹${Number(q.default_rate_per_kg || 0).toFixed(0)}/kg`,
      })),
    [qualities]
  )

  const partyOptions = useMemo<SearchableSelectOption[]>(
    () =>
      parties.map((p) => ({
        value: p.id,
        label: `${p.code} — ${p.name}`,
        sublabel: p.gstin ? `GSTIN: ${p.gstin}` : (p.types?.length ? p.types.join(', ') : undefined),
        badge: p.types?.[0] || p.code,
      })),
    [parties]
  )

  const vehicleOptions = useMemo<SearchableSelectOption[]>(
    () =>
      masterVehicles
        .filter((v) => v.is_active)
        .map((v) => ({
          value: v.lorry_number,
          label: v.lorry_number,
          sublabel: v.owner_name
            ? `Owner: ${v.owner_name}${v.capacity_mt ? ` (${v.capacity_mt} MT)` : ''}`
            : undefined,
          badge: v.vehicle_type || 'Heavy',
        })),
    []
  )

        const onFormSubmit = async (data: BillFormData) => {
    const partyId = (data.party_id || '').trim();
    const qualityGradeId = (data.quality_id || '').trim();

    if (!partyId) {
      toast.error('From Party is required.');
      return;
    }
    if (!UUID_REGEX.test(partyId)) {
      toast.error(`Invalid Party ID ('${partyId}'). Please select a party from the dropdown.`);
      return;
    }

    if (!qualityGradeId) {
      toast.error('Quality Grade is required.');
      return;
    }
    if (!UUID_REGEX.test(qualityGradeId)) {
      toast.error(`Invalid Quality Grade ID ('${qualityGradeId}'). Please select a quality from the dropdown.`);
      return;
    }

    if (!data.lorry_number?.trim()) {
      toast.error('Lorry Number is required.');
      return;
    }

    try {
      await onSubmit({
        bill_date: data.bill_date,
        bill_number: data.bill_number?.trim() || undefined,
        party_code: data.party_code.trim().toUpperCase(),
        party_id: partyId,
        quality_id: qualityGradeId,
        quality_grade_id: qualityGradeId,
        lorry_number: data.lorry_number.trim().toUpperCase(),
        lorry_no: data.lorry_number.trim().toUpperCase(),
        quantity_mt: data.quantity_mt,
        bill_rate: data.bill_rate,
        actual_rate: data.actual_rate,
        payment_status: data.payment_status,
        rtgs_reference: data.rtgs_reference?.trim() || undefined,
        remarks: data.remarks?.trim() || undefined,
        created_by: initialData?.created_by || 'Admin User',
      } as any)

      if (!initialData) {
        localStorage.removeItem(DRAFT_KEY)
        setHasDraft(false)
      }
    } catch {
      // handled in parent/service
    }
  }

  const handleResetForm = () => {
    reset(defaultValues)
    localStorage.removeItem(DRAFT_KEY)
    setHasDraft(false)
    setClearDialogOpen(false)
    toast.info('Form cleared')
  }

  const isRtgsRefEnabled =
    watchedPaymentStatus === 'paid' || watchedPaymentStatus === 'partial'

  return (
    <div className="space-y-5 select-none">
      {/* ─── DRAFT RESTORE BANNER ─── */}
      {hasDraft && !initialData && (
        <DraftRestoreBanner
          onRestore={restoreDraft}
          onDiscard={discardDraft}
        />
      )}

      {/* ─── MOBILE COLLAPSIBLE CALCULATION BAR (< 1280px) ─── */}
      <MobileCalcCollapsible
        quantityMt={typeof watchedQty === 'number' ? watchedQty : ''}
        billRate={typeof watchedBillRate === 'number' ? watchedBillRate : ''}
        actualRate={typeof watchedActualRate === 'number' ? watchedActualRate : ''}
        calculation={calculation}
        filledFieldsCount={filledFieldsCount}
      />

      {/* ─────────────────────────────────────────────────────────────
          TWO-COLUMN LAYOUT: Form Card (Left) + Calculation Panel (Right)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5 items-start">
        {/* ─────────────────────────────────────────────────────────────
            LEFT COLUMN: MAIN FORM CARD
            ───────────────────────────────────────────────────────────── */}
        <form
          id={formId}
          onSubmit={handleSubmit(onFormSubmit)}
          className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
          noValidate
        >
          {/* Card Top Strip */}
          <div className="bg-amber-600 px-5 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-white/80" />
              <h3 className="text-sm font-semibold tracking-wide">
                {initialData ? 'Edit Bill Entry' : 'Bill Entry Form'}
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-amber-100 font-mono font-medium">
                {filledFieldsCount}/8 fields
              </span>
              <div className="w-16 sm:w-20 h-1.5 bg-amber-900/60 rounded-full overflow-hidden">
                <div
                  className="bg-white/80 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(filledFieldsCount / 8) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {/* ─── GROUP A: BASIC DETAILS ─── */}
            <div className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                📅 Basic Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Popover Picker */}
                <Controller
                  control={control}
                  name="bill_date"
                  render={({ field }) => (
                    <BillDatePicker
                      label="DATE"
                      required
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.bill_date?.message}
                    />
                  )}
                />

                {/* Bill Number / Invoice No */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      BILL NUMBER / INVOICE NO
                    </label>
                    <span className="text-xs text-slate-400 italic">Optional</span>
                  </div>

                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-400 transition-all">
                    <div className="pl-3 text-slate-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. INV-2451"
                      {...register('bill_number')}
                      className="w-full h-10 px-2.5 text-sm font-mono text-slate-800 border-none outline-none bg-transparent placeholder:text-slate-400 placeholder:font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── GROUP B: PARTY & MATERIAL ─── */}
            <div className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                👥 Party &amp; Material
              </span>

              {/* Smart Unified Party Lookup */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    FROM PARTY <span className="text-red-500">*</span>
                  </label>
                  {matchedParty && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Matched Party
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-2">
                  {/* Short Code Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Code (e.g. P001)"
                      value={watchedPartyCode}
                      onChange={(e) => handlePartyCodeChange(e.target.value)}
                      className={cn(
                        'w-full h-10 px-3 bg-white border rounded-lg text-sm font-mono font-bold uppercase tracking-wide transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400',
                        errors.party_code
                          ? 'border-red-300 ring-2 ring-red-500/10'
                          : 'border-slate-300'
                      )}
                    />
                  </div>

                  {/* Party SearchableSelect */}
                  <div>
                    <Controller
                      control={control}
                      name="party_id"
                      render={({ field }) => (
                        <SearchableSelect
                          options={partyOptions}
                          value={field.value}
                          onChange={(val) => handlePartySelect(val)}
                          placeholder={isLoadingMasterData ? "Loading parties..." : "Search by party code or name..."}
                          searchPlaceholder="Search party name or code..."
                          error={errors.party_id?.message}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Selected Party Confirmation Chip */}
                {matchedParty ? (
                  <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-bold font-mono">{matchedParty.code}</span>
                      <span className="text-slate-400">&bull;</span>
                      <span className="font-semibold truncate">{matchedParty.name}</span>
                      {matchedParty.gstin && (
                        <span className="text-amber-700 font-normal">({matchedParty.gstin})</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setValue('party_id', '', { shouldDirty: true })
                        setValue('party_code', '', { shouldDirty: true })
                      }}
                      className="text-amber-700 hover:text-amber-900 text-[11px] font-semibold underline ml-2 shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : watchedPartyCode ? (
                  <div className="px-3 py-1.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-xs text-amber-700 flex items-center gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                    <span>No registered party matching code "{watchedPartyCode}"</span>
                  </div>
                ) : null}

                {errors.party_code && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.party_code.message}
                  </p>
                )}
              </div>

              {/* Quality & Vehicle 2-col */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Quality */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      QUALITY <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <Controller
                    control={control}
                    name="quality_id"
                    render={({ field }) => (
                      <SearchableSelect
                        options={qualityOptions}
                        value={field.value}
                        onChange={(val) => {
                          field.onChange(val)
                          handleQualitySelect(val)
                        }}
                        placeholder={isLoadingMasterData ? "Loading qualities..." : "Select material quality..."}
                        searchPlaceholder="Search qualities..."
                        error={errors.quality_id?.message}
                      />
                    )}
                  />
                </div>

                {/* Lorry Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      LORRY NO <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">Free text or master</span>
                  </div>
                  <Controller
                    control={control}
                    name="lorry_number"
                    render={({ field }) => (
                      <SearchableSelect
                        options={vehicleOptions}
                        value={field.value}
                        onChange={(val) => field.onChange(val.toUpperCase())}
                        placeholder="Vehicle registration (e.g. MH15AG5911)"
                        searchPlaceholder="Search / enter vehicle plate..."
                        allowCustom
                        error={errors.lorry_number?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* ─── GROUP C: QUANTITY & RATES ─── */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
                  ⚖ Quantity &amp; Rates
                </span>
                <span className="text-xs text-slate-400 italic hidden sm:inline">
                  (Changes update calculation instantly)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* QTY (MT) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      QTY (MT) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">3 decimals</span>
                  </div>

                  <div
                    className={cn(
                      'flex items-center border rounded-lg overflow-hidden transition-all bg-white',
                      errors.quantity_mt
                        ? 'border-red-300 ring-2 ring-red-500/10'
                        : 'border-slate-300 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-400'
                    )}
                  >
                    <div className="pl-3 text-slate-400 shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="0.000"
                      value={typeof watchedQty === 'number' && !isNaN(watchedQty) ? watchedQty : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? ('' as any) : parseFloat(e.target.value)
                        setValue('quantity_mt', val, { shouldValidate: true, shouldDirty: true })
                      }}
                      className="flex-1 h-10 px-2.5 text-right font-mono font-bold text-sm text-slate-900 border-none outline-none tabular-nums bg-transparent placeholder:text-slate-400"
                    />
                    <div className="px-3 h-10 bg-slate-100 border-l border-slate-200 text-xs font-semibold text-slate-600 flex items-center shrink-0">
                      MT
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-mono pt-0.5">
                    = {formatKG(numQty * 1000)}
                  </p>

                  {errors.quantity_mt && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3.5 h-3.5" /> {errors.quantity_mt.message}
                    </p>
                  )}
                </div>

                {/* Bill Rate (₹/kg) */}
                <RateInputField
                  label="BILL RATE"
                  required
                  helperText="Invoice rate"
                  sublabel="Rate on physical bill"
                  value={typeof watchedBillRate === 'number' && !isNaN(watchedBillRate) ? watchedBillRate : ''}
                  onChange={(val) => {
                    setValue('bill_rate', val as number, { shouldValidate: true, shouldDirty: true })
                  }}
                  error={errors.bill_rate?.message}
                />

                {/* Actual Rate (₹/kg) */}
                <RateInputField
                  label="ACTUAL RATE"
                  required
                  helperText="RTGS rate"
                  sublabel="Agreed settlement rate"
                  value={typeof watchedActualRate === 'number' && !isNaN(watchedActualRate) ? watchedActualRate : ''}
                  onChange={(val) => {
                    setValue('actual_rate', val as number, { shouldValidate: true, shouldDirty: true })
                  }}
                  error={errors.actual_rate?.message}
                />
              </div>
            </div>

            {/* ─── GROUP D: SETTLEMENT & PAYMENT ─── */}
            <div className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                💳 Settlement &amp; Payment
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Status Dropdown */}
                <Controller
                  control={control}
                  name="payment_status"
                  render={({ field }) => (
                    <PaymentStatusSelect
                      value={field.value as PaymentStatusType}
                      onChange={field.onChange}
                      error={errors.payment_status?.message}
                    />
                  )}
                />

                {/* RTGS Reference / UTR Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      RTGS REFERENCE / UTR
                    </label>
                    <span className="text-xs text-slate-400 italic">
                      {isRtgsRefEnabled ? 'Optional' : 'Locked'}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'flex items-center border rounded-lg overflow-hidden transition-all',
                      isRtgsRefEnabled
                        ? 'bg-white border-slate-300 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-400'
                        : 'bg-slate-50 border-slate-200 opacity-80 cursor-not-allowed'
                    )}
                  >
                    <input
                      type="text"
                      placeholder={
                        isRtgsRefEnabled
                          ? 'e.g. RTGS20260916001'
                          : 'RTGS reference'
                      }
                      disabled={!isRtgsRefEnabled}
                      {...register('rtgs_reference')}
                      className={cn(
                        'w-full h-10 px-3 text-sm font-mono text-slate-800 border-none outline-none bg-transparent placeholder:text-slate-400 placeholder:font-sans',
                        !isRtgsRefEnabled && 'cursor-not-allowed text-slate-400'
                      )}
                    />
                    {!isRtgsRefEnabled && (
                      <div className="pr-3 text-slate-400 shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {isRtgsRefEnabled
                      ? 'Enter the bank UTR or transaction reference number'
                      : 'Available when payment status is Paid or Partial'}
                  </p>
                </div>
              </div>
            </div>

            {/* ─── GROUP E: REMARKS ─── */}
            <div className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                📝 Remarks
              </span>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    REMARKS / SETTLEMENT NOTES
                  </label>
                  <span className="text-xs font-mono text-slate-400">
                    {(watch('remarks') || '').length}/300
                  </span>
                </div>

                <textarea
                  rows={3}
                  maxLength={300}
                  placeholder="Transaction notes, adjustment context, verification details..."
                  {...register('remarks')}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 text-slate-800 resize-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* ─── INLINE FORM ACTIONS ─── */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {!initialData ? (
                <button
                  type="button"
                  onClick={() => setClearDialogOpen(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              ) : (
                onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )
              )}

              {lastDraftSaved && !initialData && (
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  💾 Saved at {lastDraftSaved}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-3.5 h-3.5" />
                    <span>{initialData ? 'Update Bill Entry' : 'Save Bill Entry'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT COLUMN: STICKY CALCULATION PANEL (Desktop >= 1280px)
            ───────────────────────────────────────────────────────────── */}
        <div className="hidden xl:block sticky top-6">
          <BillCalculationPanel
            quantityMt={typeof watchedQty === 'number' ? watchedQty : ''}
            billRate={typeof watchedBillRate === 'number' ? watchedBillRate : ''}
            actualRate={typeof watchedActualRate === 'number' ? watchedActualRate : ''}
            calculation={calculation}
            filledFieldsCount={filledFieldsCount}
          />
        </div>
      </div>

      {/* Confirmation Dialog for Form Clear */}
      {clearDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 rounded-xl bg-amber-50">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Clear Bill Entry Form?</h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to clear all entered values? Any unsaved changes in this session will be discarded.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearDialogOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
              >
                Yes, Clear Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BillEntryForm
