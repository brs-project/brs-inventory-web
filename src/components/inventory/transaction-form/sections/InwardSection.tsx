import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { FormSection } from '../FormSection'
import { WeightInputField } from '../../WeightInputField'
import { CombinedLoadBanner } from '../fields/VarianceDisplay'
import { SearchableSelect } from '../../SearchableSelect'
import type { TransactionFormData } from '../../TransactionForm'

export interface InwardSectionProps {
  control: Control<TransactionFormData>
  errors: FieldErrors<TransactionFormData>
  inwardNum: number
  godownNum: number
  totalWeight: number
  godownOptions: Array<{ value: string; label: string; sublabel?: string; badge?: string }>
  isSaving?: boolean
}

export function InwardSection({
  control,
  errors,
  inwardNum = 0,
  godownNum = 0,
  totalWeight = 0,
  godownOptions,
  isSaving = false,
}: InwardSectionProps) {
  return (
    <FormSection
      title="Step 2: Additional Yard Loading (Our Godown Stock)"
      subtitle="Material added from internal warehouse inventory onto the lorry alongside inward goods"
      dotColor="bg-emerald-500"
      badgeText="STOCK DEPLETION"
      badgeColor="bg-emerald-50 text-emerald-700 border border-emerald-200/60"
    >
      {/* Row 1: Source Godown & Material Loaded from Godown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Storage Godown */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              SOURCE STORAGE GODOWN / BAY
            </label>
            <span className="text-xs text-zinc-400 italic">Inventory Bay</span>
          </div>

          <Controller
            name="godown_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={godownOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Select warehouse bay or yard (optional)..."
                searchPlaceholder="Search godown name, code, bay..."
                disabled={isSaving}
              />
            )}
          />
        </div>

        {/* Material Loaded from Godown (MT) */}
        <div>
          <Controller
            name="godown_weight"
            control={control}
            render={({ field }) => (
              <WeightInputField
                label="MATERIAL LOADED FROM GODOWN"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.godown_weight?.message}
                disabled={isSaving}
                placeholder="0.000"
                hint="Added from yard stock onto vehicle"
              />
            )}
          />
        </div>
      </div>

      {/* Row 2: Combined Total Vehicle Load Banner */}
      <div>
        <CombinedLoadBanner
          inwardWeight={inwardNum}
          godownWeight={godownNum}
          totalWeight={totalWeight}
        />
      </div>
    </FormSection>
  )
}

export default InwardSection
