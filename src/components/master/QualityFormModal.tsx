import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Save, Award, IndianRupee, FileText } from 'lucide-react'
import { cn } from '@lib/utils'
import type { Quality } from '@types'

const CATEGORIES = ['Scrap', 'Heavy', 'Processed', 'Primary', 'Other']
const UOMS = ['MT', 'KG', 'Ton']

const gradeSchema = z.object({
  quality_code: z
    .string()
    .min(1, 'Grade code is required')
    .max(20, 'Maximum 20 characters'),
  quality_name: z
    .string()
    .min(2, 'Grade name must be at least 2 characters')
    .max(255, 'Maximum 255 characters'),
  category: z.string().optional(),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  hsn_code: z.string().min(1, 'HSN code is required'),
  default_rate_per_kg: z.number().min(0, 'Rate must be >= 0'),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type GradeFormData = z.infer<typeof gradeSchema>

export interface GradeModalProps {
  open: boolean
  onClose: () => void
  quality?: Quality | null
  onSave: (data: Omit<Quality, 'id' | 'created_at'> & { default_rate_per_kg?: number }) => Promise<void>
  nextCode?: string
}

export function GradeModal({
  open,
  onClose,
  quality,
  onSave,
  nextCode = 'Q001',
}: GradeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(quality)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      quality_code: nextCode,
      quality_name: '',
      category: 'Scrap',
      unit_of_measure: 'MT',
      hsn_code: '7204',
      default_rate_per_kg: 0,
      description: '',
      is_active: true,
    },
  })

  const codeValue = watch('quality_code')

  useEffect(() => {
    if (open) {
      if (quality) {
        reset({
          quality_code: quality.quality_code || (quality as any).code || '',
          quality_name: quality.quality_name || (quality as any).name || '',
          category: quality.category || 'Scrap',
          unit_of_measure: quality.unit_of_measure || 'MT',
          hsn_code: quality.hsn_code || '7204',
          default_rate_per_kg: Number(quality.default_rate_per_kg ?? (quality as any).defaultRatePerKg ?? 0),
          description: quality.description || '',
          is_active: quality.is_active !== undefined ? quality.is_active : true,
        })
      } else {
        reset({
          quality_code: nextCode,
          quality_name: '',
          category: 'Scrap',
          unit_of_measure: 'MT',
          hsn_code: '7204',
          default_rate_per_kg: 0,
          description: '',
          is_active: true,
        })
      }
    }
  }, [open, quality, nextCode, reset])

  if (!open) return null

  const onSubmit = async (data: GradeFormData) => {
    setIsSubmitting(true)
    try {
      await onSave({
        ...data,
        quality_code: data.quality_code.toUpperCase().trim(),
        quality_name: data.quality_name.trim(),
        hsn_code: data.hsn_code.trim(),
        default_rate_per_kg: isNaN(data.default_rate_per_kg) ? 0 : data.default_rate_per_kg,
      })
      onClose()
    } catch {
      // Error handled by caller toast
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
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-zinc-200/90 z-50 overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span>{isEditing ? 'Edit Quality Grade' : 'Add Quality Grade'}</span>
                {codeValue && (
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200/70">
                    {codeValue}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500">
                Configure scrap commodity grade, tariff HSN code, and base valuation rate.
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
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Grade Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('quality_code')}
                onChange={(e) => setValue('quality_code', e.target.value.toUpperCase())}
                placeholder="e.g. Q001"
                className={cn(
                  'w-full px-3 py-2 text-xs sm:text-sm font-mono font-bold uppercase rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition',
                  errors.quality_code ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                )}
              />
              {errors.quality_code && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.quality_code.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Commodity / Grade Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('quality_name')}
                placeholder="e.g. HMS 1&2 (80:20)"
                className={cn(
                  'w-full px-3 py-2 text-xs sm:text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition',
                  errors.quality_name ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                )}
              />
              {errors.quality_name && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.quality_name.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: HSN Code & Default Rate per KG */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-zinc-400" />
                HSN Tariff Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                {...register('hsn_code')}
                placeholder="7204"
                className={cn(
                  'w-full px-3 py-2 text-xs sm:text-sm font-mono rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition',
                  errors.hsn_code ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                )}
              />
              {errors.hsn_code && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.hsn_code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                <IndianRupee className="h-3.5 w-3.5 text-zinc-400" />
                Default Rate (₹/kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('default_rate_per_kg', { valueAsNumber: true })}
                  placeholder="0.00"
                  className={cn(
                    'w-full px-3 py-2 text-xs sm:text-sm font-mono font-semibold rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition',
                    errors.default_rate_per_kg ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-300'
                  )}
                />
                <span className="absolute right-3 top-2.5 text-[11px] font-mono text-zinc-400 pointer-events-none">
                  ₹/kg
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Unit of Measure & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Unit of Measure</label>
              <select
                {...register('unit_of_measure')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition cursor-pointer"
              >
                {UOMS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Category</label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50">
            <div>
              <span className="text-xs font-semibold text-zinc-800 block">Active Material Grade</span>
              <span className="text-[11px] text-zinc-500 block">
                Available for scrap inventory intake, billing, and outward dispatch
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
              className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-600/20 transition flex items-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isEditing ? 'Update Grade' : 'Save Grade'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GradeModal
export { GradeModal as QualityFormModal }
