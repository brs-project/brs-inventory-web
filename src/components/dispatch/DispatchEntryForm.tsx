import { useState, useEffect, useMemo } from 'react'
import {
  RotateCcw,
  Save,
  Send,
  AlertTriangle,
  FileText,
  Truck,
  Hash,
  Scale,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { SearchableSelect, type SearchableSelectOption } from '@components/inventory/SearchableSelect'
import { DispatchDatePicker } from './form/DispatchDatePicker'
import { DispatchStatusControl, type DispatchStatus } from './form/DispatchStatusControl'
import { DispatchPreviewPanel } from './preview/DispatchPreviewPanel'
import { useDispatch } from '@hooks/useDispatch'
import { useParties, useQualities, useVehicles } from '@hooks/useMasterData'
import supabase from '@/services/supabaseClient'
import { cn } from '@lib/utils'
import type { DispatchEntry } from '@types'

const LOCAL_STORAGE_DRAFT_KEY = 'dispatch_entry_form_draft_v2'

const dispatchSchema = z.object({
  dispatch_date: z.string().min(1, 'Date is required').refine((val) => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return val <= today;
  }, {
    message: 'Future dates are not allowed. Please select today or a past date.',
  }),
  quality_id: z.string().min(1, 'Quality is required'),
  lorry_number: z.string().min(1, 'Lorry number is required'),
  bill_weight: z.number().positive('Weight must be greater than 0'),
  party_id: z.string().min(1, 'Party is required'),
  bill_number: z.string().optional(),
  transporter: z.string().min(1, 'Transporter is required'),
  dispatch_bill_number: z.string().min(1, 'Dispatch bill number is required'),
  remarks: z.string().max(300, 'Remarks cannot exceed 300 characters').optional(),
  status: z.enum(['draft', 'dispatched', 'cancelled']),
})

export type DispatchFormData = z.infer<typeof dispatchSchema>

export interface DispatchEntryFormProps {
  parties?: any[]
  qualityGrades?: any[]
  initialData?: DispatchEntry
  isEdit?: boolean
  onSuccess?: (entry: DispatchEntry) => void
  onCancel?: () => void
}

export function DispatchEntryForm({
  initialData,
  isEdit = false,
  parties: propParties,
  qualityGrades: propQualityGrades,
  onSuccess,
  onCancel,
}: DispatchEntryFormProps) {
    const { parties: hookParties = [] } = useParties()
  const { qualities: hookQualities = [] } = useQualities()
  const { vehicles: hookVehicles = [] } = useVehicles()

  const masterParties = (propParties && propParties.length > 0) ? propParties : (hookParties || [])
  const masterQualities = (propQualityGrades && propQualityGrades.length > 0) ? propQualityGrades : (hookQualities || [])
  const masterVehicles = hookVehicles || []

  // Ensure parties and qualityGrades are initialized as safe arrays []
  const [parties, setParties] = useState<any[]>(masterParties || [])
  const [qualityGrades, setQualityGrades] = useState<any[]>(masterQualities || [])

  useEffect(() => {
    setParties(masterParties || [])
  }, [masterParties])

  useEffect(() => {
    setQualityGrades(masterQualities || [])
  }, [masterQualities])
  const {
    createDispatch,
    updateDispatch,
    isSaving,
    getTransporters,
    getNextDispatchBillNumber,
  } = useDispatch()

  const nextSuggestedDB = useMemo(() => getNextDispatchBillNumber(), [getNextDispatchBillNumber])

  // Form states
  const [dispatchDate, setDispatchDate] = useState<string>(
    initialData?.dispatch_date || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  )
  const [qualityId, setQualityId] = useState<string>(initialData?.quality_id || '')
  const [lorryNumber, setLorryNumber] = useState<string>(initialData?.lorry_number || '')
  const [billWeight, setBillWeight] = useState<number | ''>(
    initialData?.bill_weight !== undefined ? initialData.bill_weight : ''
  )
  const [partyId, setPartyId] = useState<string>(initialData?.party_id || '')
  const [billNumber, setBillNumber] = useState<string>(initialData?.bill_number || '')
  const [transporter, setTransporter] = useState<string>(initialData?.transporter || '')
  const [dispatchBillNumber, setDispatchBillNumber] = useState<string>(
    initialData?.dispatch_bill_number || (isEdit ? '' : nextSuggestedDB)
  )
  const [remarks, setRemarks] = useState<string>(initialData?.remarks || '')
  const [status, setStatus] = useState<DispatchStatus>(
    initialData?.status || 'dispatched'
  )

  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof DispatchFormData, string>>>({})

  // Mobile preview accordion toggle
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  // Clear dialog state
  const [clearDialogOpen, setClearDialogOpen] = useState<boolean>(false)

  // Draft restore state
  const [restorableDraft, setRestorableDraft] = useState<Partial<DispatchFormData> | null>(() => {
    if (isEdit) return null
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed
        }
      }
    } catch {
      // ignore
    }
    return null
  })
  const [showRestoreBanner, setShowRestoreBanner] = useState<boolean>(() => !isEdit && !!restorableDraft)

  // Options memoization
    const _buyerOptions = useMemo<SearchableSelectOption[]>(() => {
    void _buyerOptions;
    return (parties || masterParties || [])
      .filter((p: any) => p && p.is_active && ((Array.isArray(p?.types) ? p.types.includes('BUYER') : p?.types === 'BUYER') || true))
      .map((p: any) => ({
        value: p.id,
        label: p.party_name || p.name || 'Unnamed Party',
        sublabel: `${p.party_code || p.code || ''}${p.city ? ' • ' + p.city : ''}`,
        badge: p.city,
      }))
  }, [parties, masterParties])

  const liveTransporters = useMemo(() => {
    const fromMaster = (parties || masterParties || [])
      .filter((p: any) => p && p.is_active && (Array.isArray(p?.types) ? p.types.includes('TRANSPORTER') : p?.types === 'TRANSPORTER'))
      .map((p: any) => p.party_name)
    const combined = Array.from(new Set([...fromMaster, ...(getTransporters ? getTransporters() : [])]))
    return combined
  }, [parties, masterParties, getTransporters])

  const qualityOptions = useMemo<SearchableSelectOption[]>(() => {
    return (qualityGrades || masterQualities || [])
      .filter((q: any) => q && q.is_active)
      .map((q: any) => ({
        value: q.id,
        label: `${q.quality_code || ''} — ${q.quality_name || q.name || ''}`,
        sublabel: q.description,
        badge: q.category || 'Scrap',
      }))
  }, [qualityGrades, masterQualities])

  const vehicleOptions = useMemo<SearchableSelectOption[]>(() => {
    return (masterVehicles || [])
      .filter((v: any) => v && v.is_active)
      .map((v: any) => ({
        value: v.lorry_number,
        label: v.lorry_number,
        sublabel: v.owner_name
          ? `Owner: ${v.owner_name}${v.capacity_mt ? ` (${v.capacity_mt} MT)` : ''}`
          : undefined,
        badge: v.vehicle_type || 'Heavy',
      }))
  }, [masterVehicles])

  const partyOptions = useMemo<SearchableSelectOption[]>(() => {
    return (parties || masterParties || [])
      .filter((p: any) => p && p.is_active)
      .map((p: any) => ({
        value: p.id,
        label: p.party_name || p.name || 'Unnamed Party',
        sublabel: `${p.party_code || p.code || ''}${p.city ? ` • ${p.city}` : ''}`,
        badge: p.city,
      }))
  }, [parties, masterParties])

  const transporterList = liveTransporters || []
  const transporterOptions = useMemo<SearchableSelectOption[]>(() => {
    return (transporterList || []).map((t: string) => ({
      value: t,
      label: t,
    }))
  }, [transporterList])

  // Check if current lorryNumber is in master vehicles
  const isCustomLorry = useMemo(() => {
    if (!lorryNumber || !lorryNumber.trim()) return false
    const match = (masterVehicles || []).some(
      (v: any) => v && v.lorry_number && v.lorry_number.toLowerCase() === lorryNumber.toLowerCase().trim()
    )
    return !match
  }, [lorryNumber, masterVehicles])

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (isEdit) return

    const interval = setInterval(() => {
      const hasContent =
        qualityId ||
        lorryNumber ||
        partyId ||
        billWeight !== '' ||
        billNumber ||
        transporter ||
        remarks

      if (hasContent) {
        const currentData = {
          dispatch_date: dispatchDate,
          quality_id: qualityId,
          lorry_number: lorryNumber,
          bill_weight: billWeight,
          party_id: partyId,
          bill_number: billNumber,
          transporter,
          dispatch_bill_number: dispatchBillNumber,
          remarks,
          status,
          savedAt: new Date().toISOString(),
        }
        localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(currentData))
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [
    isEdit,
    dispatchDate,
    qualityId,
    lorryNumber,
    billWeight,
    partyId,
    billNumber,
    transporter,
    dispatchBillNumber,
    remarks,
    status,
  ])

  // Restore draft handler
  const handleRestoreDraft = () => {
    if (restorableDraft) {
      if (restorableDraft.dispatch_date) setDispatchDate(restorableDraft.dispatch_date)
      if (restorableDraft.quality_id) setQualityId(restorableDraft.quality_id)
      if (restorableDraft.lorry_number) setLorryNumber(restorableDraft.lorry_number)
      if (restorableDraft.bill_weight !== undefined && !isNaN(Number(restorableDraft.bill_weight))) {
        setBillWeight(Number(restorableDraft.bill_weight))
      }
      if (restorableDraft.party_id) setPartyId(restorableDraft.party_id)
      if (restorableDraft.bill_number) setBillNumber(restorableDraft.bill_number)
      if (restorableDraft.transporter) setTransporter(restorableDraft.transporter)
      if (restorableDraft.dispatch_bill_number) setDispatchBillNumber(restorableDraft.dispatch_bill_number)
      if (restorableDraft.remarks) setRemarks(restorableDraft.remarks)
      if (restorableDraft.status) setStatus(restorableDraft.status)

      setShowRestoreBanner(false)
      toast.success('Draft restored successfully')
    }
  }

  const handleDismissDraft = () => {
    localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY)
    setShowRestoreBanner(false)
    setRestorableDraft(null)
  }

  // Clear form handler
  const handleClearForm = () => {
    setDispatchDate(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
    setQualityId('')
    setLorryNumber('')
    setBillWeight('')
    setPartyId('')
    setBillNumber('')
    setTransporter('')
    setDispatchBillNumber(nextSuggestedDB)
    setRemarks('')
    setStatus('dispatched')
    setErrors({})
    localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY)
    setClearDialogOpen(false)
    toast.info('Form cleared')
  }

  // Submit handler
  const handleSubmit = async (targetStatus: 'draft' | 'dispatched') => {
    setErrors({})

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    if (dispatchDate > today || new Date(dispatchDate) > new Date(today)) {
      toast.error('Future dates are not allowed. Please select today or a past date.');
      return;
    }

    const payload = {
      dispatch_date: dispatchDate,
      quality_id: qualityId,
      lorry_number: lorryNumber.toUpperCase().trim(),
      bill_weight: billWeight === '' ? (NaN as any) : Number(Number(billWeight).toFixed(3)),
      party_id: partyId,
      bill_number: billNumber.trim(),
      transporter: transporter.trim(),
      dispatch_bill_number: dispatchBillNumber.trim() || nextSuggestedDB,
      remarks: remarks.trim(),
      status: targetStatus,
    }

    const validation = dispatchSchema.safeParse(payload)

    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof DispatchFormData, string>> = {}
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof DispatchFormData
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      })
      setErrors(fieldErrors)
      toast.error('Please fix the highlighted errors in the form before submitting')
      return
    }

    try {
      if (isEdit && initialData) {
        const updated = await updateDispatch(initialData.id, payload)
        localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY)
        onSuccess?.(updated)
      } else {
        const { error: insertErr } = await supabase.from('dispatch_records').insert({
          outward_bill_no: payload.dispatch_bill_number,
          dispatch_date: payload.dispatch_date,
          quality_grade_id: payload.quality_id,
          party_id: payload.party_id,
          transporter_id: null,
          lorry_no: payload.lorry_number,
          bill_wt_mt: Number(payload.bill_weight),
          purchase_bill_no: payload.bill_number || '',
          status: 'dispatched'
        }).select().single()

        if (insertErr) {
          toast.error(insertErr.message || 'Failed to insert dispatch record')
          alert(`Error: ${insertErr.message}`)
          return
        }

        const created = await createDispatch({
          ...payload,
          created_by: 'Admin User',
        } as any)
        localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY)
        onSuccess?.(created)
      }
    } catch {
      // Handled in hook
    }
  }

  const weightInKg = useMemo(() => {
    const w = typeof billWeight === 'number' ? billWeight : 0
    return Math.round(w * 1000)
  }, [billWeight])

  // Preview data object
  const previewData = {
    dispatch_date: dispatchDate,
    status,
    dispatch_bill_number: dispatchBillNumber,
    quality_id: qualityId,
    lorry_number: lorryNumber,
    bill_weight: billWeight,
    party_id: partyId,
    bill_number: billNumber,
    transporter,
    remarks,
  }

  return (
    <div className="space-y-5 select-none">
      {/* Restore Draft Banner */}
      {showRestoreBanner && !isEdit && (
        <div className="p-4 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-indigo-900">
                Unsaved Dispatch Draft Found
              </p>
              <p className="text-xs text-indigo-700">
                You have an unsaved dispatch entry from a previous session. Would you like to restore it?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Restore Draft
            </button>
            <button
              type="button"
              onClick={handleDismissDraft}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Mobile Collapsible Preview Accordion (< 1024px) */}
      <div className="block lg:hidden bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
          className="w-full px-4 py-3 bg-indigo-600 text-white flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-white/80" />
            <span className="text-xs font-bold tracking-wide">Dispatch Preview</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-white/20 px-2 py-0.5 rounded">
              {typeof billWeight === 'number' ? billWeight.toFixed(3) : '0.000'} MT
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform duration-200',
                mobilePreviewOpen && 'rotate-180'
              )}
            />
          </div>
        </button>

        {mobilePreviewOpen && (
          <div className="p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-150">
            <DispatchPreviewPanel
              data={previewData}
              qualities={(qualityGrades || masterQualities || []) as any}
              parties={(parties || masterParties || []) as any}
            />
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TWO-COLUMN LAYOUT: Form Card (Left) + Sticky Preview (Right)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* ─────────────────────────────────────────────────────────────
            LEFT COLUMN: FORM CARD
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden pb-20 lg:pb-0">
          {/* Card Top Header Strip */}
          <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/50" />
              <h3 className="text-sm font-semibold tracking-wide">
                {isEdit ? 'Edit Dispatch Entry' : 'New Dispatch Entry'}
              </h3>
            </div>

            <span className="text-xs font-mono text-indigo-100 font-medium">
              {isEdit ? 'Update Mode' : 'Step 1 of 1'}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {/* ─── GROUP A: DATE & STATUS ─── */}
            <div className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                📅 Dispatch Information
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date Popover Picker */}
                <DispatchDatePicker
                  label="DATE"
                  required
                  value={dispatchDate}
                  onChange={(d) => {
                    setDispatchDate(d)
                    if (errors.dispatch_date) setErrors((prev) => ({ ...prev, dispatch_date: undefined }))
                  }}
                  error={errors.dispatch_date}
                />

                {/* Status Segmented Control */}
                <DispatchStatusControl
                  value={status}
                  onChange={setStatus}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* ─── GROUP B: QUALITY & VEHICLE ─── */}
            <div className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                🌟 Quality &amp; Vehicle
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quality Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      QUALITY <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <SearchableSelect
                    options={qualityOptions}
                    value={qualityId}
                    onChange={(val) => {
                      setQualityId(val)
                      if (errors.quality_id) setErrors((prev) => ({ ...prev, quality_id: undefined }))
                    }}
                    placeholder="Select scrap grade..."
                    searchPlaceholder="Search quality grades..."
                    error={errors.quality_id}
                  />
                </div>

                {/* Lorry No Select / Free Text */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      LORRY NO <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">Free text or master</span>
                  </div>
                  <SearchableSelect
                    options={vehicleOptions}
                    value={lorryNumber}
                    onChange={(val) => {
                      setLorryNumber(val.toUpperCase())
                      if (errors.lorry_number) setErrors((prev) => ({ ...prev, lorry_number: undefined }))
                    }}
                    placeholder="MH 12 EW 4171..."
                    searchPlaceholder="Search / type lorry plate..."
                    allowCustom={true}
                    error={errors.lorry_number}
                  />
                  {isCustomLorry && (
                    <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                      <Truck className="w-3 h-3 text-amber-500" />
                      <span>Custom vehicle — not found in master database</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ─── GROUP C: WEIGHT & PARTY ─── */}
            <div className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                ⚖ Weight &amp; Party
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bill Weight (MT) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      BILL WT (MT) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">3 decimal places</span>
                  </div>

                  <div
                    className={cn(
                      'flex items-center border rounded-lg overflow-hidden transition-colors bg-white',
                      errors.bill_weight
                        ? 'border-red-300 ring-2 ring-red-500/10'
                        : 'border-slate-300 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20'
                    )}
                  >
                    <div className="pl-3 text-slate-400 shrink-0">
                      <Scale className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={billWeight}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                        setBillWeight(val)
                        if (errors.bill_weight) setErrors((prev) => ({ ...prev, bill_weight: undefined }))
                      }}
                      placeholder="0.000"
                      className="flex-1 h-10 px-2.5 text-right font-mono font-semibold text-sm text-slate-900 border-none outline-none tabular-nums bg-transparent placeholder:text-slate-400"
                    />
                    <div className="px-3 h-10 bg-slate-100 border-l border-slate-200 text-xs font-medium text-slate-600 flex items-center shrink-0">
                      MT
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                    <span className="font-mono">= {weightInKg.toLocaleString()} KG</span>
                  </div>

                  {errors.bill_weight && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> {errors.bill_weight}
                    </p>
                  )}
                </div>

                {/* Party Name Select */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      PARTY NAME <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <SearchableSelect
                    options={partyOptions}
                    value={partyId}
                    onChange={(val) => {
                      setPartyId(val)
                      if (errors.party_id) setErrors((prev) => ({ ...prev, party_id: undefined }))
                    }}
                    placeholder="Select party / buyer..."
                    searchPlaceholder="Search party name or code..."
                    error={errors.party_id}
                  />
                </div>
              </div>
            </div>

            {/* ─── GROUP D: BILLING & TRANSPORT ─── */}
            <div className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                🧾 Billing &amp; Transport
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bill No (Internal / Purchase Ref) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      BILL NO
                    </label>
                    <span className="text-xs text-slate-400">Optional — Purchase Ref</span>
                  </div>

                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-colors">
                    <div className="pl-3 text-slate-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={billNumber}
                      onChange={(e) => setBillNumber(e.target.value)}
                      placeholder="e.g. PB-1045"
                      className="w-full h-10 px-2.5 text-sm font-mono text-slate-800 border-none outline-none bg-transparent placeholder:text-slate-400 placeholder:font-sans"
                    />
                  </div>
                </div>

                {/* Transporter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      TRANSPORTER <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs text-slate-400">Select or custom</span>
                  </div>
                  <SearchableSelect
                    options={transporterOptions}
                    value={transporter}
                    onChange={(val) => {
                      setTransporter(val)
                      if (errors.transporter) setErrors((prev) => ({ ...prev, transporter: undefined }))
                    }}
                    placeholder="Rajesh Transport Co..."
                    searchPlaceholder="Search / enter transporter..."
                    allowCustom={true}
                    error={errors.transporter}
                  />
                </div>
              </div>
            </div>

            {/* ─── GROUP E: DISPATCH BILL & REMARKS ─── */}
            <div className="p-5 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                # Dispatch Invoice
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dispatch Bill Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      DISPATCH BILL NO <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <div
                    className={cn(
                      'flex items-center border rounded-lg overflow-hidden bg-white transition-colors',
                      errors.dispatch_bill_number
                        ? 'border-red-300 ring-2 ring-red-500/10'
                        : 'border-slate-300 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20'
                    )}
                  >
                    <div className="pl-3 text-indigo-600 shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={dispatchBillNumber}
                      onChange={(e) => {
                        setDispatchBillNumber(e.target.value.toUpperCase())
                        if (errors.dispatch_bill_number) {
                          setErrors((prev) => ({ ...prev, dispatch_bill_number: undefined }))
                        }
                      }}
                      placeholder="e.g. DB-2304"
                      className="w-full h-10 px-2.5 text-sm font-mono font-bold text-slate-900 border-none outline-none bg-transparent placeholder:text-slate-400 placeholder:font-sans"
                    />
                  </div>

                  {/* Suggestion Hint below */}
                  <div className="flex items-center gap-1 text-xs text-indigo-500 pt-0.5">
                    <span>💡 Next: <strong className="font-mono">{nextSuggestedDB}</strong></span>
                    {dispatchBillNumber !== nextSuggestedDB && (
                      <button
                        type="button"
                        onClick={() => setDispatchBillNumber(nextSuggestedDB)}
                        className="text-indigo-600 font-semibold hover:underline ml-1 cursor-pointer"
                      >
                        [Use this &rarr;]
                      </button>
                    )}
                  </div>

                  {errors.dispatch_bill_number && (
                    <p className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> {errors.dispatch_bill_number}
                    </p>
                  )}
                </div>

                {/* Remarks */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      REMARKS
                    </label>
                    <span className="text-xs text-slate-400 font-mono">
                      {remarks.length}/300
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    maxLength={300}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Delivery instructions, gate pass notes..."
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 resize-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              INLINE FORM ACTIONS (Desktop Bottom Strip)
              ───────────────────────────────────────────────────────────── */}
          <div className="hidden lg:flex px-5 py-4 bg-slate-50 border-t border-slate-200 items-center justify-between">
            <div>
              {!isEdit ? (
                <button
                  type="button"
                  onClick={() => setClearDialogOpen(true)}
                  disabled={isSaving}
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
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 text-amber-700 text-xs font-semibold shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit('dispatched')}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : isEdit ? 'Update Dispatch' : 'Save Dispatch'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT COLUMN: STICKY DISPATCH PREVIEW PANEL (Desktop)
            ───────────────────────────────────────────────────────────── */}
        <div className="hidden lg:block sticky top-6">
          <DispatchPreviewPanel
            data={previewData}
            qualities={(qualityGrades || masterQualities || []) as any}
              parties={(parties || masterParties || []) as any}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE SAFE FIXED BOTTOM ACTION BAR (< 1024px)
          ───────────────────────────────────────────────────────────── */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-40 shadow-lg">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          {!isEdit ? (
            <button
              type="button"
              onClick={() => setClearDialogOpen(true)}
              disabled={isSaving}
              className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
              title="Clear form"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          ) : (
            onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSaving}
                className="p-2.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isSaving}
            className="flex-1 py-2.5 px-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold text-center transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('dispatched')}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold text-center shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : isEdit ? 'Update' : 'Save Dispatch'}
          </button>
        </div>
      </div>

      {/* Clear Confirmation Dialog Modal */}
      {clearDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setClearDialogOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white rounded-xl p-5 shadow-xl border border-slate-200 z-50 text-center animate-in zoom-in-95 duration-150 space-y-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Clear all fields?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This will reset all dispatch form inputs and discard unsaved draft changes.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClearDialogOpen(false)}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                No, Keep
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                className="flex-1 py-2 px-3 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition cursor-pointer shadow-2xs"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DispatchEntryForm
