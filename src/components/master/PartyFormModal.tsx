import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Save, Building2, User, Phone, MapPin, FileText } from 'lucide-react'
import { cn } from '@lib/utils'
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
  party_type: z.enum(['BUYER', 'SELLER', 'BOTH']),
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
  city: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  is_active: z.boolean(),
})

type PartyFormData = z.infer<typeof partySchema>

export interface PartyModalProps {
  open: boolean
  onClose: () => void
  party?: Party | null
  onSave: (data: Omit<Party, 'id' | 'created_at'> & { types: ('BUYER' | 'SELLER')[] }) => Promise<void>
  nextCode?: string
}

export function PartyModal({
  open,
  onClose,
  party,
  onSave,
  nextCode = 'P001',
}: PartyModalProps) {
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
      party_type: 'BUYER',
      contact_person: '',
      phone: '',
      gst_number: '',
      city: '',
      state: 'Maharashtra',
      address: '',
      is_active: true,
    },
  })

  const selectedType = watch('party_type')
  const codeValue = watch('party_code')

  // Determine initial party type from party.types
  const getInitialPartyType = (p?: Party | null): 'BUYER' | 'SELLER' | 'BOTH' => {
    if (!p) return 'BUYER'
    const types = (p as any).types || []
    const isBuyer = types.includes('BUYER')
    const isSeller = types.includes('SELLER')
    if (isBuyer && isSeller) return 'BOTH'
    if (isSeller) return 'SELLER'
    return 'BUYER'
  }

  useEffect(() => {
    if (open) {
      if (party) {
        reset({
          party_code: party.party_code || (party as any).code || '',
          party_name: party.party_name || (party as any).name || '',
          party_type: getInitialPartyType(party),
          contact_person: party.contact_person || (party as any).contactPerson || '',
          phone: party.phone || (party as any).phoneNumber || '',
          gst_number: party.gst_number || (party as any).gstin || '',
          city: party.city || '',
          state: party.state || 'Maharashtra',
          address: party.address || '',
          is_active: party.is_active !== undefined ? party.is_active : true,
        })
      } else {
        reset({
          party_code: nextCode,
          party_name: '',
          party_type: 'BUYER',
          contact_person: '',
          phone: '',
          gst_number: '',
          city: '',
          state: 'Maharashtra',
          address: '',
          is_active: true,
        })
      }
    }
  }, [open, party, nextCode, reset])

  if (!open) return null

  const onSubmit = async (data: PartyFormData) => {
    setIsSubmitting(true)
    try {
      const types: ('BUYER' | 'SELLER')[] =
        data.party_type === 'BOTH'
          ? ['BUYER', 'SELLER']
          : data.party_type === 'SELLER'
          ? ['SELLER']
          : ['BUYER']

      await onSave({
        ...data,
        party_code: data.party_code.toUpperCase().trim(),
        party_name: data.party_name.trim(),
        gst_number: data.gst_number ? data.gst_number.toUpperCase().trim() : undefined,
        types,
      })
      onClose()
    } catch {
      // Error handled by caller
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Body */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200/90 z-50 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span>{isEditing ? 'Edit Trading Party' : 'Add New Trading Party'}</span>
                {codeValue && (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70">
                    {codeValue}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500">
                Register trading accounts for raw material purchase (Seller) and finished goods sales (Buyer).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Party Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('party_code')}
                onChange={(e) => setValue('party_code', e.target.value.toUpperCase())}
                placeholder="e.g. P001"
                className={cn(
                  'w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold uppercase rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition',
                  errors.party_code ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                )}
              />
              {errors.party_code && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.party_code.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Company / Trade Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('party_name')}
                placeholder="e.g. Shree Om Scrap Traders"
                className={cn(
                  'w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition',
                  errors.party_name ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                )}
              />
              {errors.party_name && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.party_name.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Trading Account Type (Buyer / Seller / Both) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Trading Account Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setValue('party_type', 'BUYER')}
                className={cn(
                  'py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer',
                  selectedType === 'BUYER'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs'
                    : 'bg-zinc-50/60 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                )}
              >
                <span>🏢 Buyer (Customer)</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('party_type', 'SELLER')}
                className={cn(
                  'py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer',
                  selectedType === 'SELLER'
                    ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-2xs'
                    : 'bg-zinc-50/60 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                )}
              >
                <span>📦 Seller (Supplier)</span>
              </button>

              <button
                type="button"
                onClick={() => setValue('party_type', 'BOTH')}
                className={cn(
                  'py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer',
                  selectedType === 'BOTH'
                    ? 'bg-purple-50 border-purple-400 text-purple-700 shadow-2xs'
                    : 'bg-zinc-50/60 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                )}
              >
                <span>🔄 Both (Buyer &amp; Seller)</span>
              </button>
            </div>
          </div>

          {/* Row 3: GSTIN */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-zinc-400" />
              GSTIN (Tax Identification)
            </label>
            <input
              type="text"
              maxLength={15}
              {...register('gst_number')}
              onChange={(e) => setValue('gst_number', e.target.value.toUpperCase())}
              placeholder="e.g. 27AABCU9603R1ZX (15 chars)"
              className={cn(
                'w-full px-3 py-2 text-xs sm:text-sm font-mono uppercase rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition',
                errors.gst_number ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
              )}
            />
            {errors.gst_number && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.gst_number.message}</p>
            )}
          </div>

          {/* Row 4: Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-zinc-400" />
                Contact Person
              </label>
              <input
                type="text"
                {...register('contact_person')}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                Phone Number
              </label>
              <input
                type="tel"
                maxLength={10}
                {...register('phone')}
                placeholder="10-digit number (e.g. 9822012345)"
                className={cn(
                  'w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition',
                  errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                )}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Row 5: City & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                City
              </label>
              <input
                type="text"
                {...register('city')}
                placeholder="e.g. Jalna"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">State</label>
              <select
                {...register('state')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 6: Active Status */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
            <div>
              <span className="text-xs font-semibold text-zinc-800 block">Active Status</span>
              <span className="text-[11px] text-zinc-500 block">
                Allow transactions, invoices, and vouchers with this party
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register('is_active')} className="sr-only peer" />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-200/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-4 rounded-xl border border-zinc-300 bg-white text-zinc-700 text-xs sm:text-sm font-semibold hover:bg-zinc-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-70 cursor-pointer"
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

export default PartyModal
export { PartyModal as PartyFormModal }
