import { toast } from 'sonner'
import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { Sparkles, Trash2, RotateCcw } from 'lucide-react'
import { PartyFormModal } from '@components/master/PartyFormModal'
import { QualityFormModal } from '@components/master/QualityFormModal'
import { useParties, useQualities, useGodowns, useVehicles } from '@hooks/useMasterData'
import { useInventory, type TransactionInput } from '@hooks/useInventory'
import type { Party, Quality } from '@types'

import { TransactionFormLayout } from './transaction-form/TransactionFormLayout'
import { BasicInfoSection } from './transaction-form/sections/BasicInfoSection'
import { InwardSection } from './transaction-form/sections/InwardSection'
import { OutwardSection } from './transaction-form/sections/OutwardSection'
import { RemarksSection } from './transaction-form/sections/RemarksSection'
import { TransactionPreview } from './transaction-form/preview/TransactionPreview'
import { FormActions } from './transaction-form/FormActions'

export const transactionFormSchema = z.object({
  transaction_date: z.date({
    error: 'Date is required',
  }),
  party_id: z.string().min(1, 'From Party is required'),
  quality_id: z.string().min(1, 'Quality grade is required'),
  godown_id: z.string().optional(),
  vehicle_in_id: z.string().optional(),
  bill_number: z.string().optional(),
  inward_weight: z.number().min(0, 'Inward weight must be positive').optional(),
  godown_weight: z.number().min(0, 'Godown weight must be positive').optional(),
  vehicle_out_id: z.string().optional(),
  outward_weight: z.number().min(0, 'Outward weight must be positive').optional(),
  remarks: z.string().max(500, 'Maximum 500 characters').optional(),
  status: z.enum(['draft', 'completed']),
})

export type TransactionFormData = z.infer<typeof transactionFormSchema>

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const DRAFT_STORAGE_KEY = 'inventory_transaction_form_draft_v1'

export interface TransactionFormProps {
  onSuccess?: (billNumber: string) => void
  initialValues?: Partial<TransactionFormData>
  transactionId?: string
  isEditing?: boolean
}

export function TransactionForm({
  onSuccess,
  initialValues,
  transactionId,
  isEditing = false,
}: TransactionFormProps) {
  const { parties, createParty, getNextPartyCode } = useParties()
  const { qualities, createQuality, getNextQualityCode } = useQualities()
  const { godowns } = useGodowns()
  const { vehicles } = useVehicles()
  const { createTransaction, updateTransaction, isSaving, getNextBillNumber } = useInventory()

  // Auto-Save Draft state
  const [hasDraftAvailable, setHasDraftAvailable] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)

  // Quick Master Modals state
  const [partyModalOpen, setPartyModalOpen] = useState(false)
  const [qualityModalOpen, setQualityModalOpen] = useState(false)

  // Mobile preview collapse state
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      transaction_date: initialValues?.transaction_date || new Date(),
      party_id: initialValues?.party_id || '',
      quality_id: initialValues?.quality_id || '',
      godown_id: initialValues?.godown_id || '',
      vehicle_in_id: initialValues?.vehicle_in_id || '',
      bill_number: initialValues?.bill_number || getNextBillNumber(),
      inward_weight: initialValues?.inward_weight ?? 0,
      godown_weight: initialValues?.godown_weight ?? 0,
      vehicle_out_id: initialValues?.vehicle_out_id || '',
      outward_weight: initialValues?.outward_weight ?? 0,
      remarks: initialValues?.remarks || '',
      status: initialValues?.status || 'completed',
    },
  })

  // Check for saved draft on mount (only for new entries)
  useEffect(() => {
    if (!isEditing && !initialValues) {
      try {
        const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && (parsed.party_id || parsed.inward_weight > 0 || parsed.remarks)) {
            setHasDraftAvailable(true)
            setDraftSavedAt(
              parsed.savedAt
                ? format(new Date(parsed.savedAt), 'dd/MM/yyyy HH:mm')
                : 'Recently'
            )
          }
        }
      } catch {
        // Ignore JSON error
      }
    }
  }, [isEditing, initialValues])

  // Periodic Auto-save draft every 30 seconds
  useEffect(() => {
    if (isEditing) return

    const interval = setInterval(() => {
      const vals = getValues()
      if (vals.party_id || vals.quality_id || vals.inward_weight || vals.remarks) {
        try {
          const draftPayload = {
            ...vals,
            transaction_date: vals.transaction_date
              ? vals.transaction_date.toISOString()
              : new Date().toISOString(),
            savedAt: new Date().toISOString(),
          }
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload))
        } catch {
          // Ignore write error
        }
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isEditing, getValues])

  // Resume Draft Handler
  const handleResumeDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        reset({
          ...parsed,
          transaction_date: parsed.transaction_date
            ? new Date(parsed.transaction_date)
            : new Date(),
        })
        setHasDraftAvailable(false)
      }
    } catch {
      setHasDraftAvailable(false)
    }
  }

  // Discard Draft Handler
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // Ignore
    }
    setHasDraftAvailable(false)
  }

  // Synchronize reset when initialValues changes
  useEffect(() => {
    if (initialValues) {
      reset({
        transaction_date: initialValues.transaction_date || new Date(),
        party_id: initialValues.party_id || '',
        quality_id: initialValues.quality_id || '',
        godown_id: initialValues.godown_id || '',
        vehicle_in_id: initialValues.vehicle_in_id || '',
        bill_number: initialValues.bill_number || '',
        inward_weight: initialValues.inward_weight ?? 0,
        godown_weight: initialValues.godown_weight ?? 0,
        vehicle_out_id: initialValues.vehicle_out_id || '',
        outward_weight: initialValues.outward_weight ?? 0,
        remarks: initialValues.remarks || '',
        status: initialValues.status || 'completed',
      })
    }
  }, [initialValues, reset])

  // Watch fields for live real-time preview
  const watchedDate = watch('transaction_date')
  const watchedPartyId = watch('party_id')
  const watchedQualityId = watch('quality_id')
  const watchedGodownId = watch('godown_id')
  const watchedBillNumber = watch('bill_number')
  const watchedVehicleInId = watch('vehicle_in_id')
  const watchedVehicleOutId = watch('vehicle_out_id')
  const watchedInward = watch('inward_weight')
  const watchedGodown = watch('godown_weight')
  const watchedOutward = watch('outward_weight')
  const watchedRemarks = watch('remarks')
  const watchedStatus = watch('status')

  // Real-time computed values: True Yard Loading Math
  const inwardNum = Number(watchedInward) || 0
  const godownNum = Number(watchedGodown) || 0
  const outwardNum = Number(watchedOutward) || 0

  const computedTotalWeight = useMemo(() => {
    return Math.round((inwardNum + godownNum) * 1000) / 1000
  }, [inwardNum, godownNum])

  const computedDispatchVariance = useMemo(() => {
    return Math.round((outwardNum - computedTotalWeight) * 1000) / 1000
  }, [outwardNum, computedTotalWeight])

  // Dropdown Options mapping
  const partyOptions = useMemo(() => {
    return parties
      .filter((p) => p.is_active && p.id)
      .map((p) => ({
        value: p.id, // Strictly Supabase UUID, not party.code or party.name
        label: p.party_name || p.name,
        sublabel: p.party_code || p.code,
        badge: p.city || 'Active',
      }))
  }, [parties])

  const qualityOptions = useMemo(() => {
    return qualities
      .filter((q) => q.is_active && q.id)
      .map((q) => ({
        value: q.id, // Strictly Supabase UUID from quality_grades, not grade.name
        label: q.quality_name || q.name,
        sublabel: q.quality_code || q.hsn_code,
        badge: q.category || 'Grade',
      }))
  }, [qualities])

  const godownOptions = useMemo(() => {
    return godowns
      .filter((g) => g.is_active)
      .map((g) => ({
        value: g.id,
        label: g.godown_name,
        sublabel: g.godown_code,
        badge: g.capacity_mt ? `${g.capacity_mt.toLocaleString()} MT` : undefined,
      }))
  }, [godowns])

  const vehicleOptions = useMemo(() => {
    return vehicles
      .filter((v) => v.is_active)
      .map((v) => ({
        value: v.lorry_number,
        label: v.lorry_number,
        sublabel: v.owner_name || 'Fleet',
        badge: v.vehicle_type || 'Truck',
      }))
  }, [vehicles])

  // Submit handler
  const handleFormSubmit = async (data: TransactionFormData) => {
    const partyId = (data.party_id || '').trim()
    const qualityGradeId = (data.quality_id || '').trim()
    const weightMt = Number(data.inward_weight)

    // Check all required fields (party_id, quality_grade_id, weight_mt) before submitting
    if (!partyId) {
      toast.error('From Party is required.')
      return
    }
    if (!UUID_REGEX.test(partyId)) {
      toast.error(`Invalid Party ID ('${partyId}'). Must be a valid UUID.`)
      return
    }

    if (!qualityGradeId) {
      toast.error('Quality Grade is required.')
      return
    }
    if (!UUID_REGEX.test(qualityGradeId)) {
      toast.error(`Invalid Quality Grade ID ('${qualityGradeId}'). Must be a valid UUID.`)
      return
    }

    if (!weightMt || isNaN(weightMt) || weightMt <= 0) {
      toast.error('Inward Weight (MT) is required and must be greater than 0.')
      return
    }

    const input: TransactionInput = {
      ...data,
      party_id: partyId,
      quality_id: qualityGradeId,
      qualityGradeId: qualityGradeId,
      bill_number: data.bill_number?.trim() || getNextBillNumber(),
      inward_weight: weightMt,
      weightMt: weightMt,
      godown_weight: Number(data.godown_weight) || 0,
      outward_weight: Number(data.outward_weight) || 0,
    }

    console.log('[AddTransaction / TransactionForm] Exact form submission payload:', input)

    // Clear auto-saved draft upon submission
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      setHasDraftAvailable(false)
    } catch {
      // Ignore
    }

    try {
      if (transactionId || isEditing) {
        const targetId = transactionId || data.bill_number || ''
        const updated = await updateTransaction(targetId, input)
        onSuccess?.(updated.bill_number || '')
      } else {
        const created = await createTransaction(input)
        onSuccess?.(created.bill_number || '')
      }
    } catch (err: any) {
      console.error('[AddTransaction / TransactionForm] Error submitting transaction:', err)
      const detail = err?.details ? ` (${err.details})` : ''
      const hint = err?.hint ? ` [Hint: ${err.hint}]` : ''
      const msg = err?.message ? `${err.message}${detail}${hint}` : 'Failed to save transaction'
      toast.error(msg)
    }
  }

  // Clear Form handler
  const handleClearForm = () => {
    reset({
      transaction_date: new Date(),
      party_id: '',
      quality_id: '',
      godown_id: '',
      vehicle_in_id: '',
      bill_number: getNextBillNumber(),
      inward_weight: 0,
      godown_weight: 0,
      vehicle_out_id: '',
      outward_weight: 0,
      remarks: '',
      status: 'completed',
    })
  }

  // Quick save triggers
  const handleSaveAsDraft = () => {
    setValue('status', 'draft', { shouldValidate: true })
    handleSubmit(handleFormSubmit)()
  }

  const handleSaveAsCompleted = () => {
    setValue('status', 'completed', { shouldValidate: true })
    handleSubmit(handleFormSubmit)()
  }

  return (
    <div className="space-y-4">
      {/* Draft Recovery Banner */}
      {hasDraftAvailable && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                You have an unsaved draft from {draftSavedAt}
              </p>
              <p className="text-[11px] text-amber-700">
                Resume from previous state or discard to start clean.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Discard</span>
            </button>
            <button
              type="button"
              onClick={handleResumeDraft}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Resume Draft</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <TransactionFormLayout
          formContent={
            <>
              {/* Step 1: Consignment Source & Inward Receipt */}
              <BasicInfoSection
                control={control}
                register={register}
                setValue={setValue}
                errors={errors}
                watchedDate={watchedDate}
                watchedStatus={watchedStatus}
                partyOptions={partyOptions}
                qualityOptions={qualityOptions}
                vehicleOptions={vehicleOptions}
                isSaving={isSaving}
                onOpenPartyModal={() => setPartyModalOpen(true)}
                onOpenQualityModal={() => setQualityModalOpen(true)}
              />

              {/* Step 2: Additional Yard Loading (Our Godown Stock) */}
              <InwardSection
                control={control}
                errors={errors}
                inwardNum={inwardNum}
                godownNum={godownNum}
                totalWeight={computedTotalWeight}
                godownOptions={godownOptions}
                isSaving={isSaving}
              />

              {/* Step 3: Outward Dispatch & Gate Reconciliation */}
              <OutwardSection
                control={control}
                errors={errors}
                outwardNum={outwardNum}
                totalWeight={computedTotalWeight}
                dispatchVariance={computedDispatchVariance}
                vehicleOptions={vehicleOptions}
                isSaving={isSaving}
              />

              {/* Step 4: Remarks & Audit Notes */}
              <RemarksSection
                register={register}
                errors={errors}
                remarksValue={watchedRemarks}
                isSaving={isSaving}
              />

              {/* Bottom Action Buttons */}
              <FormActions
                isSaving={isSaving}
                isEditing={isEditing}
                onClear={handleClearForm}
                onSaveDraft={handleSaveAsDraft}
                onSaveCompleted={handleSaveAsCompleted}
              />
            </>
          }
          previewContent={
            <TransactionPreview
              date={watchedDate}
              billNumber={watchedBillNumber}
              status={watchedStatus}
              partyId={watchedPartyId}
              qualityId={watchedQualityId}
              godownId={watchedGodownId}
              vehicleInId={watchedVehicleInId}
              vehicleOutId={watchedVehicleOutId}
              inwardWeight={inwardNum}
              godownWeight={godownNum}
              outwardWeight={outwardNum}
              totalWeight={computedTotalWeight}
              dispatchVariance={computedDispatchVariance}
              parties={parties}
              qualities={qualities}
              godowns={godowns}
              isMobileOpen={isMobilePreviewOpen}
              onToggleMobile={() => setIsMobilePreviewOpen(!isMobilePreviewOpen)}
            />
          }
        />
      </form>

      {/* Quick Master Registration Modals */}
      <PartyFormModal
        open={partyModalOpen}
        onClose={() => setPartyModalOpen(false)}
        onSave={async (data: Omit<Party, 'id' | 'created_at'>) => {
          const newParty = await createParty(data)
          setValue('party_id', newParty.id, { shouldValidate: true })
        }}
        nextCode={getNextPartyCode()}
      />

      <QualityFormModal
        open={qualityModalOpen}
        onClose={() => setQualityModalOpen(false)}
        onSave={async (data: Omit<Quality, 'id' | 'created_at'>) => {
          const newQuality = await createQuality(data)
          setValue('quality_id', newQuality.id, { shouldValidate: true })
        }}
        nextCode={getNextQualityCode()}
      />
    </div>
  )
}

export default TransactionForm
