import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Save, Building2 } from 'lucide-react'
import type { Party } from '@types'

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

const partySchema = z.object({
  party_code: z
    .string()
    .min(1, 'Party code is required')
    .max(20, 'Maximum 20 characters'),
  party_name: z
    .string()
    .min(2, 'Party name must be at least 2 characters')
    .max(255, 'Maximum 255 characters'),
  contact_person: z.string().optional(),
  phone: z
    .string()
    .refine(
      (val) => !val || /^[0-9]{10}$/.test(val.trim()),
      'Phone must be exactly 10 digits'
    )
    .optional(),
  gst_number: z
    .string()
    .refine(
      (val) =>
        !val ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
          val.trim().toUpperCase()
        ),
      'Invalid GSTIN format (e.g. 27AABCU9603R1ZX)'
    )
    .optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  is_active: z.boolean(),
})

type PartyFormData = z.infer<typeof partySchema>

interface PartyFormModalProps {
  open: boolean
  onClose: () => void
  party?: Party | null
  onSave: (data: Omit<Party, 'id' | 'created_at'>) => Promise<void>
  nextCode?: string
}

export function PartyFormModal({
  open,
  onClose,
  party,
  onSave,
  nextCode = 'P001',
}: PartyFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(party)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PartyFormData>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      party_code: nextCode,
      party_name: '',
      contact_person: '',
      phone: '',
      gst_number: '',
      address: '',
      city: '',
      state: 'Gujarat',
      is_active: true,
    },
  })

  // Watch isActive value for custom toggle switch
  const isActiveValue = watch('is_active')

  // Reset form with party data or next auto-code when modal opens
  useEffect(() => {
    if (open) {
      if (party) {
        reset({
          party_code: party.party_code,
          party_name: party.party_name,
          contact_person: party.contact_person || '',
          phone: party.phone || '',
          gst_number: party.gst_number || '',
          address: party.address || '',
          city: party.city || '',
          state: party.state || 'Gujarat',
          is_active: party.is_active,
        })
      } else {
        reset({
          party_code: nextCode,
          party_name: '',
          contact_person: '',
          phone: '',
          gst_number: '',
          address: '',
          city: '',
          state: 'Gujarat',
          is_active: true,
        })
      }
    }
  }, [open, party, nextCode, reset])

  if (!open) return null

  const onSubmit = async (data: PartyFormData) => {
    setIsSubmitting(true)
    try {
      await onSave({
        ...data,
        party_code: data.party_code.toUpperCase().trim(),
        gst_number: data.gst_number ? data.gst_number.toUpperCase().trim() : undefined,
      })
      onClose()
    } catch {
      // Error handled by hook toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Semi-transparent Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Body */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200/90 z-50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 leading-tight">
                {isEditing ? `Edit Party — ${party?.party_name}` : 'Add New Party'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEditing
                  ? 'Update supply partner profile and GST registration'
                  : 'Register a new vendor, supplier, or customer profile'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition focus:outline-none cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Row 1: Party Code & Party Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="party_code"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Party Code <span className="text-rose-500">*</span>
              </label>
              <input
                id="party_code"
                type="text"
                disabled={isEditing || isSubmitting}
                placeholder="P001"
                {...register('party_code')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-zinc-50 uppercase font-mono font-bold transition focus:outline-none focus:bg-white ${
                  errors.party_code
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-100'
                    : 'border-zinc-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                } disabled:bg-zinc-100 disabled:text-zinc-500`}
              />
              {errors.party_code && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.party_code.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="party_name"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Party / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="party_name"
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. XYZ Traders & Metals Pvt Ltd"
                {...register('party_name')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-zinc-50 transition focus:outline-none focus:bg-white ${
                  errors.party_name
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-100'
                    : 'border-zinc-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                }`}
              />
              {errors.party_name && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.party_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contact_person"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Contact Person
              </label>
              <input
                id="contact_person"
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Rajesh Shah"
                {...register('contact_person')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 bg-zinc-50 transition focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                Phone Number (10 Digits)
              </label>
              <input
                id="phone"
                type="tel"
                maxLength={10}
                disabled={isSubmitting}
                placeholder="9876543210"
                {...register('phone')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-zinc-50 font-mono transition focus:outline-none focus:bg-white ${
                  errors.phone
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-100'
                    : 'border-zinc-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 3: GST Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="gst_number"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                GST Number (GSTIN)
              </label>
              <input
                id="gst_number"
                type="text"
                maxLength={15}
                disabled={isSubmitting}
                placeholder="e.g. 27AABCU9603R1ZX"
                {...register('gst_number')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-zinc-50 uppercase font-mono transition focus:outline-none focus:bg-white ${
                  errors.gst_number
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-100'
                    : 'border-zinc-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                }`}
              />
              {errors.gst_number && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  {errors.gst_number.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Full Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
            >
              Registered Address
            </label>
            <textarea
              id="address"
              rows={2}
              disabled={isSubmitting}
              placeholder="Enter premise address, industrial zone, road name..."
              {...register('address')}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 bg-zinc-50 transition focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          {/* Row 5: City & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="city"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                City / Town
              </label>
              <input
                id="city"
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Mumbai"
                {...register('city')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 bg-zinc-50 transition focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5"
              >
                State
              </label>
              <select
                id="state"
                disabled={isSubmitting}
                {...register('state')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-zinc-300 bg-zinc-50 transition focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 6: Is Active Toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
              <div>
                <span className="text-xs font-bold text-zinc-800 block">Active Status</span>
                <span className="text-[11px] text-zinc-500">
                  Allow this party to be selected in weighbridge inward/outward transactions
                </span>
              </div>

              <button
                type="button"
                onClick={() => setValue('is_active', !isActiveValue, { shouldDirty: true })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActiveValue ? 'bg-indigo-600' : 'bg-zinc-300'
                }`}
                role="switch"
                aria-checked={isActiveValue}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isActiveValue ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-300 bg-white text-zinc-700 text-xs sm:text-sm font-semibold hover:bg-zinc-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/25 transition disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Update Party' : 'Save Party'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PartyFormModal
