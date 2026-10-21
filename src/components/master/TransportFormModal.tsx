import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  X,
  Loader2,
  Save,
  Truck,
  Building2,
  User,
  Phone,
  Scale,
  IndianRupee,
  MapPin,
  Package,
} from 'lucide-react'
import {
  fetchTransporterOptions,
  type TransporterPartyOption,
  type CreateTransportInput,
  type TransportWithParty,
} from '@/services/transportService'
import { cn } from '@lib/utils'

const MATERIAL_SUGGESTIONS = [
  'Scrap',
  'HMS 1&2',
  'Heavy Melting Scrap',
  'Cast Iron',
  'Bundles',
  'Turning Scrap',
  'Shredded Scrap',
  'Sponge Iron',
  'Billet',
  'Rebar / TMT',
]

const transportSchema = z.object({
  vehicle_number: z
    .string()
    .min(3, 'Vehicle number is required (min 3 chars)')
    .max(25, 'Maximum 25 characters'),
  transporter_id: z.string().optional(),
  transporter_name: z.string().optional(),
  driver_name: z.string().optional(),
  driver_phone: z
    .string()
    .refine(
      (val) => !val || /^[0-9]{10}$/.test(val.trim()),
      'Phone must be a valid 10-digit number'
    )
    .optional(),
  default_tare_weight_mt: z.number().min(0, 'Tare weight must be >= 0'),
  default_freight_rate_per_mt: z.number().min(0, 'Freight rate must be >= 0'),
  fixed_trip_charge: z.number().min(0, 'Fixed trip charge must be >= 0'),
  default_route: z.string().optional(),
  material_type: z.string().optional(),
  is_active: z.boolean(),
})

type TransportFormData = z.infer<typeof transportSchema>

interface TransportFormModalProps {
  open: boolean
  onClose: () => void
  transport?: TransportWithParty | null
  onSave: (data: CreateTransportInput) => Promise<void>
}

export function TransportFormModal({
  open,
  onClose,
  transport,
  onSave,
}: TransportFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transporterOptions, setTransporterOptions] = useState<TransporterPartyOption[]>([])
  const [loadingTransporters, setLoadingTransporters] = useState(false)
  const isEditing = Boolean(transport)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransportFormData>({
    resolver: zodResolver(transportSchema),
    defaultValues: {
      vehicle_number: '',
      transporter_id: '',
      transporter_name: '',
      driver_name: '',
      driver_phone: '',
      default_tare_weight_mt: 0,
      default_freight_rate_per_mt: 0,
      fixed_trip_charge: 0,
      default_route: '',
      material_type: '',
      is_active: true,
    },
  })

  const vehicleNumberValue = watch('vehicle_number')

  // Load transporter parties from Supabase
  useEffect(() => {
    let mounted = true
    async function loadTransporters() {
      if (!open) return
      setLoadingTransporters(true)
      try {
        const opts = await fetchTransporterOptions()
        if (mounted) {
          setTransporterOptions(opts)
        }
      } catch (err) {
        console.error('Failed to load transporters:', err)
      } finally {
        if (mounted) setLoadingTransporters(false)
      }
    }
    loadTransporters()
    return () => {
      mounted = false
    }
  }, [open])

  // Populate form on open / record change
  useEffect(() => {
    if (open) {
      if (transport) {
        reset({
          vehicle_number: transport.vehicle_number || '',
          transporter_id: transport.transporter_id || '',
          transporter_name: transport.transporter_name || '',
          driver_name: transport.driver_name || '',
          driver_phone: transport.driver_phone || '',
          default_tare_weight_mt: Number(transport.default_tare_weight_mt ?? 0),
          default_freight_rate_per_mt: Number(transport.default_freight_rate_per_mt ?? 0),
          fixed_trip_charge: Number(transport.fixed_trip_charge ?? 0),
          default_route: transport.default_route || '',
          material_type: transport.material_type || '',
          is_active: Boolean(transport.is_active),
        })
      } else {
        reset({
          vehicle_number: '',
          transporter_id: '',
          transporter_name: '',
          driver_name: '',
          driver_phone: '',
          default_tare_weight_mt: 0,
          default_freight_rate_per_mt: 0,
          fixed_trip_charge: 0,
          default_route: '',
          material_type: '',
          is_active: true,
        })
      }
    }
  }, [open, transport, reset])

  if (!open) return null

  const handleTransporterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    setValue('transporter_id', selectedId)
    if (selectedId) {
      const match = transporterOptions.find((o) => o.id === selectedId)
      if (match) {
        setValue('transporter_name', match.name)
      }
    } else {
      setValue('transporter_name', '')
    }
  }

  const onSubmit = async (data: TransportFormData) => {
    setIsSubmitting(true)
    try {
      await onSave({
        vehicle_number: data.vehicle_number.trim().toUpperCase(),
        transporter_id: data.transporter_id ? data.transporter_id : null,
        transporter_name: data.transporter_name ? data.transporter_name.trim() : null,
        driver_name: data.driver_name ? data.driver_name.trim() : null,
        driver_phone: data.driver_phone ? data.driver_phone.trim() : null,
        default_tare_weight_mt: isNaN(data.default_tare_weight_mt) ? 0 : data.default_tare_weight_mt,
        default_freight_rate_per_mt: isNaN(data.default_freight_rate_per_mt) ? 0 : data.default_freight_rate_per_mt,
        fixed_trip_charge: isNaN(data.fixed_trip_charge) ? 0 : data.fixed_trip_charge,
        default_route: data.default_route ? data.default_route.trim() : null,
        material_type: data.material_type ? data.material_type.trim() : null,
        is_active: data.is_active,
      })
      onClose()
    } catch {
      // Error is caught & toasted by parent
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
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200/90 z-50 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200/80 bg-zinc-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span>{isEditing ? 'Edit Transport Vehicle' : 'Add New Transport'}</span>
                {vehicleNumberValue && (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70">
                    {vehicleNumberValue.toUpperCase()}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500">
                Register lorry number, transporter, driver contacts, tare weight, and freight tariff.
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4">
          {/* Row 1: Vehicle Number & Transporter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Vehicle Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. MH 12 AB 9988"
                  {...register('vehicle_number')}
                  onChange={(e) => {
                    setValue('vehicle_number', e.target.value.toUpperCase())
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold uppercase rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition',
                    errors.vehicle_number ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                  )}
                />
              </div>
              {errors.vehicle_number && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.vehicle_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                  Transporter Party
                </span>
                {loadingTransporters && <span className="text-[10px] text-zinc-400">Loading...</span>}
              </label>
              <select
                {...register('transporter_id')}
                onChange={handleTransporterChange}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
              >
                <option value="">-- Direct / Self Fleet (No Transporter) --</option>
                {transporterOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.code ? '[' + opt.code + '] ' : ''}{opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Driver Name & Driver Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-zinc-400" />
                Driver Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                {...register('driver_name')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-zinc-400" />
                Driver Phone
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit number (e.g. 9822012345)"
                {...register('driver_phone')}
                className={cn(
                  'w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition',
                  errors.driver_phone ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                )}
              />
              {errors.driver_phone && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.driver_phone.message}</p>
              )}
            </div>
          </div>

          {/* Row 3: Route & Preferred Material */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                Default Route
              </label>
              <input
                type="text"
                placeholder="e.g. Jalna to Pune"
                {...register('default_route')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-zinc-400" />
                Preferred Material
              </label>
              <input
                type="text"
                list="material-options"
                placeholder="e.g. Scrap, HMS 1&2"
                {...register('material_type')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              <datalist id="material-options">
                {MATERIAL_SUGGESTIONS.map((mat) => (
                  <option key={mat} value={mat} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Row 4: Commercials & Weights (3 Columns) */}
          <div className="p-3.5 bg-zinc-50/80 rounded-xl border border-zinc-200/80 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <span>Tare Weight &amp; Freight Rates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1 flex items-center gap-1">
                  <Scale className="h-3.5 w-3.5 text-zinc-400" />
                  Tare Weight (MT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    {...register('default_tare_weight_mt', { valueAsNumber: true })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono font-semibold rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-mono text-zinc-400 pointer-events-none">
                    MT
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1 flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-zinc-400" />
                  Freight Rate (₹/MT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('default_freight_rate_per_mt', { valueAsNumber: true })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono font-semibold rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-mono text-zinc-400 pointer-events-none">
                    ₹/MT
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1 flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-zinc-400" />
                  Fixed Trip Charge (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('fixed_trip_charge', { valueAsNumber: true })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm font-mono font-semibold rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-mono text-zinc-400 pointer-events-none">
                    ₹ Fix
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Active Status */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
            <div>
              <span className="text-xs font-semibold text-zinc-800 block">
                Active in Logistics
              </span>
              <span className="text-[11px] text-zinc-500 block">
                Available for gate pass, weighment, dispatch, and purchase inward slips
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('is_active')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Modal Footer */}
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
                  <span>{isEditing ? 'Update Transport' : 'Save Transport'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransportFormModal
