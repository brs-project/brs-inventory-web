import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Save, Truck } from 'lucide-react'
import type { Vehicle } from '@types'

const VEHICLE_TYPES = ['Heavy', 'Medium', 'Light', 'Container']

const vehicleSchema = z.object({
  lorry_number: z
    .string()
    .min(3, 'Lorry number is required')
    .max(25, 'Maximum 25 characters'),
  vehicle_type: z.string().min(1, 'Vehicle type is required'),
  owner_name: z.string().optional(),
  capacity_mt: z.number().min(0, 'Capacity must be a positive number').optional(),
  driver_name: z.string().optional(),
  driver_phone: z
    .string()
    .refine(
      (val) => !val || /^[0-9]{10}$/.test(val.trim()),
      'Phone must be exactly 10 digits'
    )
    .optional(),
  is_active: z.boolean(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

interface VehicleFormModalProps {
  open: boolean
  onClose: () => void
  vehicle?: Vehicle | null
  onSave: (data: Omit<Vehicle, 'id' | 'created_at'>) => Promise<void>
}

export function VehicleFormModal({
  open,
  onClose,
  vehicle,
  onSave,
}: VehicleFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(vehicle)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      lorry_number: '',
      vehicle_type: 'Heavy',
      owner_name: '',
      capacity_mt: 25,
      driver_name: '',
      driver_phone: '',
      is_active: true,
    },
  })

  const isActiveValue = watch('is_active')

  useEffect(() => {
    if (open) {
      if (vehicle) {
        reset({
          lorry_number: vehicle.lorry_number,
          vehicle_type: vehicle.vehicle_type || 'Heavy',
          owner_name: vehicle.owner_name || '',
          capacity_mt: vehicle.capacity_mt || 25,
          driver_name: vehicle.driver_name || '',
          driver_phone: vehicle.driver_phone || '',
          is_active: vehicle.is_active,
        })
      } else {
        reset({
          lorry_number: '',
          vehicle_type: 'Heavy',
          owner_name: '',
          capacity_mt: 25,
          driver_name: '',
          driver_phone: '',
          is_active: true,
        })
      }
    }
  }, [open, vehicle, reset])

  if (!open) return null

  const onSubmit = async (data: VehicleFormData) => {
    setIsSubmitting(true)
    try {
      await onSave({
        ...data,
        lorry_number: data.lorry_number.toUpperCase().trim(),
        capacity_mt: data.capacity_mt !== undefined && !isNaN(data.capacity_mt) ? Number(data.capacity_mt) : undefined,
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
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isEditing ? `Edit Vehicle — ${vehicle?.lorry_number}` : 'Register New Vehicle'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update lorry tare details, transport agency, and driver contact'
                  : 'Register a transport truck or lorry for weighbridge inward/outward access'}
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
          {/* Row 1: Lorry Number & Vehicle Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="lorry_number"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Lorry Plate / Reg Number <span className="text-red-500">*</span>
              </label>
              <input
                id="lorry_number"
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. MH 12 EW 4171"
                {...register('lorry_number')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-slate-50 uppercase font-mono font-bold transition focus:outline-none focus:bg-white ${
                  errors.lorry_number
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.lorry_number && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.lorry_number.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="vehicle_type"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Vehicle Classification <span className="text-red-500">*</span>
              </label>
              <select
                id="vehicle_type"
                disabled={isSubmitting}
                {...register('vehicle_type')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 transition focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                {VEHICLE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type} Commercial
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Owner Name & Capacity MT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="owner_name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Transport / Owner Agency
              </label>
              <input
                id="owner_name"
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Rajesh Transport Co"
                {...register('owner_name')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 transition focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="capacity_mt"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Payload Capacity (MT)
              </label>
              <input
                id="capacity_mt"
                type="number"
                step="0.01"
                disabled={isSubmitting}
                placeholder="25"
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
          </div>

          {/* Row 3: Driver Name & Driver Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="driver_name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Assigned Driver Name
              </label>
              <input
                id="driver_name"
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Arun Singh"
                {...register('driver_name')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 transition focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="driver_phone"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Driver Mobile (10 Digits)
              </label>
              <input
                id="driver_phone"
                type="tel"
                maxLength={10}
                disabled={isSubmitting}
                placeholder="9871234560"
                {...register('driver_phone')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-slate-50 font-mono transition focus:outline-none focus:bg-white ${
                  errors.driver_phone
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.driver_phone && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.driver_phone.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Is Active Toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Active Status</span>
                <span className="text-[11px] text-slate-500">
                  Allow this lorry to be chosen in weighbridge gross/tare weighments
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
                  <span>{isEditing ? 'Update Vehicle' : 'Save Vehicle'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehicleFormModal
