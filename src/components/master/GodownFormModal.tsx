import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Save, Warehouse, Activity } from 'lucide-react'
import type { Godown } from '@types'

const godownSchema = z.object({
  godown_code: z
    .string()
    .min(1, 'Godown code is required')
    .max(20, 'Maximum 20 characters'),
  godown_name: z
    .string()
    .min(2, 'Godown name must be at least 2 characters')
    .max(255, 'Maximum 255 characters'),
  capacity_mt: z.number().min(0, 'Capacity must be a positive number').optional(),
  incharge_name: z.string().optional(),
  phone: z
    .string()
    .refine(
      (val) => !val || /^[0-9]{10}$/.test(val.trim()),
      'Phone must be exactly 10 digits'
    )
    .optional(),
  address: z.string().optional(),
  is_active: z.boolean(),
})

type GodownFormData = z.infer<typeof godownSchema>

interface GodownFormModalProps {
  open: boolean
  onClose: () => void
  godown?: Godown | null
  onSave: (data: Omit<Godown, 'id' | 'created_at'>) => Promise<void>
  nextCode?: string
}

export function GodownFormModal({
  open,
  onClose,
  godown,
  onSave,
  nextCode = 'G001',
}: GodownFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(godown)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GodownFormData>({
    resolver: zodResolver(godownSchema),
    defaultValues: {
      godown_code: nextCode,
      godown_name: '',
      capacity_mt: 3000,
      incharge_name: '',
      phone: '',
      address: '',
      is_active: true,
    },
  })

  const isActiveValue = watch('is_active')
  const capacityValue = watch('capacity_mt') || 3000

  useEffect(() => {
    if (open) {
      if (godown) {
        reset({
          godown_code: godown.godown_code,
          godown_name: godown.godown_name,
          capacity_mt: godown.capacity_mt || 3000,
          incharge_name: godown.incharge_name || '',
          phone: godown.phone || '',
          address: godown.address || '',
          is_active: godown.is_active,
        })
      } else {
        reset({
          godown_code: nextCode,
          godown_name: '',
          capacity_mt: 3000,
          incharge_name: '',
          phone: '',
          address: '',
          is_active: true,
        })
      }
    }
  }, [open, godown, nextCode, reset])

  if (!open) return null

  const onSubmit = async (data: GodownFormData) => {
    setIsSubmitting(true)
    try {
      await onSave({
        ...data,
        godown_code: data.godown_code.toUpperCase().trim(),
        capacity_mt: data.capacity_mt !== undefined && !isNaN(data.capacity_mt) ? Number(data.capacity_mt) : undefined,
      })
      onClose()
    } catch {
      // Error handled by hook toast
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate mock current stock utilization (60% standard)
  const mockUtilization = 60
  const estimatedStock = ((Number(capacityValue) || 0) * (mockUtilization / 100)).toFixed(2)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isEditing ? `Edit Godown — ${godown?.godown_name}` : 'Add New Godown'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update storage capacity, supervisor contact, and location'
                  : 'Register a new storage yard, godown unit, or warehouse facility'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition focus:outline-none cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="godown_code"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Code <span className="text-red-500">*</span>
              </label>
              <input
                id="godown_code"
                type="text"
                disabled={isEditing || isSubmitting}
                placeholder="G001"
                {...register('godown_code')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-slate-50 uppercase font-mono font-bold transition focus:outline-none focus:bg-white ${
                  errors.godown_code
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                } disabled:bg-slate-100 disabled:text-slate-500`}
              />
              {errors.godown_code && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.godown_code.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="godown_name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Godown / Yard Name <span className="text-red-500">*</span>
              </label>
              <input
                id="godown_name"
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Main Godown (Central Yard)"
                {...register('godown_name')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-slate-50 transition focus:outline-none focus:bg-white ${
                  errors.godown_name
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.godown_name && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.godown_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Capacity MT & Incharge Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="capacity_mt"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Max Capacity (MT)
              </label>
              <input
                id="capacity_mt"
                type="number"
                step="0.01"
                disabled={isSubmitting}
                placeholder="5000"
                {...register('capacity_mt', { valueAsNumber: true })}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-slate-50 font-mono transition focus:outline-none focus:bg-white ${
                  errors.capacity_mt
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.capacity_mt && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.capacity_mt.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="incharge_name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Supervisor / Incharge
              </label>
              <input
                id="incharge_name"
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Ramesh Patel"
                {...register('incharge_name')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 transition focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Row 3: Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Contact Phone (10 Digits)
            </label>
            <input
              id="phone"
              type="tel"
              maxLength={10}
              disabled={isSubmitting}
              placeholder="9876541230"
              {...register('phone')}
              className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-slate-50 font-mono transition focus:outline-none focus:bg-white ${
                errors.phone
                  ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                  : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.phone.message}</p>
            )}
          </div>

          {/* Row 4: Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Facility Location / Plot Address
            </label>
            <textarea
              id="address"
              rows={2}
              disabled={isSubmitting}
              placeholder="Plot No., Industrial Zone, Road access..."
              {...register('address')}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 transition focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>

          {/* Row 5: Capacity Utilization Preview Meter */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-600" />
                Current Capacity Utilization Estimate
              </span>
              <span className="text-blue-600 font-mono font-bold">
                {estimatedStock} / {capacityValue || 0} MT ({mockUtilization}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${mockUtilization}%` }}
              />
            </div>
          </div>

          {/* Row 6: Is Active Toggle */}
          <div className="pt-1">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Active Status</span>
                <span className="text-[11px] text-slate-500">
                  Allow inward stock dumping and outward dispatch from this godown
                </span>
              </div>

              <button
                type="button"
                onClick={() => setValue('is_active', !isActiveValue, { shouldDirty: true })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isActiveValue ? 'bg-blue-600' : 'bg-slate-300'
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
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/25 transition disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Update Godown' : 'Save Godown'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GodownFormModal
