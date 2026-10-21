import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Save, Truck, User, Phone, MapPin } from 'lucide-react'
import { cn } from '@lib/utils'
import type { Transporter } from '@types'
import type { CreateTransporterInput } from '@/services/transporterService'

const transporterSchema = z.object({
  name: z
    .string()
    .min(2, 'Transporter / Agency name is required')
    .max(255, 'Maximum 255 characters'),
  contact_person: z.string().optional(),
  phone: z
    .string()
    .refine(
      (val) => !val || /^[0-9]{10}$/.test(val.trim()),
      'Phone must be exactly 10 digits'
    )
    .optional(),
  city: z.string().optional(),
  is_active: z.boolean(),
})

type TransporterFormData = z.infer<typeof transporterSchema>

export interface TransporterModalProps {
  open: boolean
  onClose: () => void
  transporter?: Transporter | null
  onSave: (data: CreateTransporterInput) => Promise<void>
}

export function TransporterModal({
  open,
  onClose,
  transporter,
  onSave,
}: TransporterModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(transporter)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransporterFormData>({
    resolver: zodResolver(transporterSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      phone: '',
      city: '',
      is_active: true,
    },
  })

  useEffect(() => {
    if (open) {
      if (transporter) {
        reset({
          name: transporter.name || '',
          contact_person: transporter.contact_person || '',
          phone: transporter.phone || '',
          city: transporter.city || '',
          is_active: transporter.is_active !== undefined ? transporter.is_active : true,
        })
      } else {
        reset({
          name: '',
          contact_person: '',
          phone: '',
          city: '',
          is_active: true,
        })
      }
    }
  }, [open, transporter, reset])

  if (!open) return null

  const onSubmit = async (data: TransporterFormData) => {
    setIsSubmitting(true)
    try {
      await onSave({
        name: data.name.trim(),
        contact_person: data.contact_person ? data.contact_person.trim() : null,
        phone: data.phone ? data.phone.trim() : null,
        city: data.city ? data.city.trim() : null,
        is_active: data.is_active,
      })
      onClose()
    } catch {
      // Error handled by parent toast
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

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200/90 z-50 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                {isEditing ? 'Edit Transporter Agency' : 'Add Transporter Agency'}
              </h2>
              <p className="text-xs text-zinc-500">
                Logistics provider profile, contact person, and operational location.
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Agency Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Transporter / Agency Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="e.g. Balaji Freight Movers"
              className={cn(
                'w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition',
                errors.name ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Contact Person / Representative
            </label>
            <input
              type="text"
              {...register('contact_person')}
              placeholder="e.g. Balaji Shinde"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>

          {/* Phone & City Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                Phone Number
              </label>
              <input
                type="tel"
                maxLength={10}
                {...register('phone')}
                placeholder="10-digit number (e.g. 9890123456)"
                className={cn(
                  'w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition',
                  errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                )}
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                City / Base Depot
              </label>
              <input
                type="text"
                {...register('city')}
                placeholder="e.g. Pune, Jalna"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
            <div>
              <span className="text-xs font-semibold text-zinc-800 block">Active Logistics Provider</span>
              <span className="text-[11px] text-zinc-500 block">
                Available for dispatch orders and transport allocation
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
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Update Transporter' : 'Save Transporter'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransporterModal
export { TransporterModal as TransporterFormModal }
