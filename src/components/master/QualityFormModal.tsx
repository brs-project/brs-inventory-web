import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Save, Award } from 'lucide-react'
import type { Quality } from '@types'

const CATEGORIES = ['Scrap', 'Heavy', 'Processed', 'Primary', 'Other']
const UOMS = ['MT', 'KG', 'Ton']

const qualitySchema = z.object({
  quality_code: z
    .string()
    .min(1, 'Quality code is required')
    .max(20, 'Maximum 20 characters'),
  quality_name: z
    .string()
    .min(2, 'Quality name must be at least 2 characters')
    .max(255, 'Maximum 255 characters'),
  category: z.string().optional(),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  hsn_code: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type QualityFormData = z.infer<typeof qualitySchema>

interface QualityFormModalProps {
  open: boolean
  onClose: () => void
  quality?: Quality | null
  onSave: (data: Omit<Quality, 'id' | 'created_at'>) => Promise<void>
  nextCode?: string
}

export function QualityFormModal({
  open,
  onClose,
  quality,
  onSave,
  nextCode = 'Q001',
}: QualityFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(quality)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QualityFormData>({
    resolver: zodResolver(qualitySchema),
    defaultValues: {
      quality_code: nextCode,
      quality_name: '',
      category: 'Scrap',
      unit_of_measure: 'MT',
      hsn_code: '7204',
      description: '',
      is_active: true,
    },
  })

  const isActiveValue = watch('is_active')

  useEffect(() => {
    if (open) {
      if (quality) {
        reset({
          quality_code: quality.quality_code,
          quality_name: quality.quality_name,
          category: quality.category || 'Scrap',
          unit_of_measure: quality.unit_of_measure || 'MT',
          hsn_code: quality.hsn_code || '7204',
          description: quality.description || '',
          is_active: quality.is_active,
        })
      } else {
        reset({
          quality_code: nextCode,
          quality_name: '',
          category: 'Scrap',
          unit_of_measure: 'MT',
          hsn_code: '7204',
          description: '',
          is_active: true,
        })
      }
    }
  }, [open, quality, nextCode, reset])

  if (!open) return null

  const onSubmit = async (data: QualityFormData) => {
    setIsSubmitting(true)
    try {
      await onSave({
        ...data,
        quality_code: data.quality_code.toUpperCase().trim(),
        hsn_code: data.hsn_code ? data.hsn_code.trim() : undefined,
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
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {isEditing ? `Edit Quality — ${quality?.quality_name}` : 'Add New Quality'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update commodity grade specifications and measurement units'
                  : 'Configure a new inventory quality grade or commodity classification'}
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
                htmlFor="quality_code"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Code <span className="text-red-500">*</span>
              </label>
              <input
                id="quality_code"
                type="text"
                disabled={isEditing || isSubmitting}
                placeholder="Q001"
                {...register('quality_code')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-slate-50 uppercase font-mono font-bold transition focus:outline-none focus:bg-white ${
                  errors.quality_code
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                } disabled:bg-slate-100 disabled:text-slate-500`}
              />
              {errors.quality_code && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.quality_code.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="quality_name"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Quality / Grade Name <span className="text-red-500">*</span>
              </label>
              <input
                id="quality_name"
                type="text"
                disabled={isSubmitting}
                placeholder="e.g. Melting Grade A, HMS 1&2"
                {...register('quality_name')}
                className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-slate-50 transition focus:outline-none focus:bg-white ${
                  errors.quality_name
                    ? 'border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
                }`}
              />
              {errors.quality_name && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {errors.quality_name.message}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Category & UOM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Category
              </label>
              <select
                id="category"
                disabled={isSubmitting}
                {...register('category')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 transition focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="unit_of_measure"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Unit of Measure (UOM) <span className="text-red-500">*</span>
              </label>
              <select
                id="unit_of_measure"
                disabled={isSubmitting}
                {...register('unit_of_measure')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 transition focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer font-semibold text-blue-600"
              >
                {UOMS.map((uom) => (
                  <option key={uom} value={uom}>
                    {uom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: HSN Code & Description */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="hsn_code"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                HSN / Tariff Code
              </label>
              <input
                id="hsn_code"
                type="text"
                disabled={isSubmitting}
                placeholder="7204"
                {...register('hsn_code')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 font-mono transition focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Description / Technical Specifications
              </label>
              <textarea
                id="description"
                rows={2}
                disabled={isSubmitting}
                placeholder="Enter scrap purity, ferrous content, or packaging details..."
                {...register('description')}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-slate-50 transition focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none"
              />
            </div>
          </div>

          {/* Row 4: Is Active Toggle */}
          <div className="pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Active Status</span>
                <span className="text-[11px] text-slate-500">
                  Enable this quality grade for inward and outward dispatch weighments
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
                  <span>{isEditing ? 'Update Quality' : 'Save Quality'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QualityFormModal
