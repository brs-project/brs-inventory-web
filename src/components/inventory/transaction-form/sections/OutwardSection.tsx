import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { FormSection } from '../FormSection'
import { WeightInputField } from '../../WeightInputField'
import { GateReconciliationDisplay } from '../fields/NetStockDisplay'
import { SearchableSelect } from '../../SearchableSelect'
import type { TransactionFormData } from '../../TransactionForm'

export interface OutwardSectionProps {
  control: Control<TransactionFormData>
  errors: FieldErrors<TransactionFormData>
  outwardNum: number
  totalWeight: number
  dispatchVariance: number
  vehicleOptions: Array<{ value: string; label: string; sublabel?: string; badge?: string }>
  isSaving?: boolean
}

export function OutwardSection({
  control,
  errors,
  outwardNum = 0,
  totalWeight = 0,
  dispatchVariance = 0,
  vehicleOptions,
  isSaving = false,
}: OutwardSectionProps) {
  return (
    <FormSection
      title="Step 3: Outward Dispatch & Gate Reconciliation"
      subtitle="Outgoing dispatch carrier and gate balance comparison against total loadable weight"
      dotColor="bg-amber-500"
      badgeText="GATE CLEARANCE"
      badgeColor="bg-amber-50 text-amber-700 border border-amber-200/60"
    >
      {/* Row 1: Lorry Out & Outward Weight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lorry Number (Out) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              OUTWARD LORRY NUMBER
            </label>
            <span className="text-xs text-zinc-400 italic">Dispatch Transport</span>
          </div>

          <Controller
            name="vehicle_out_id"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                options={vehicleOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="e.g. MH 21 KG 4114 (search or type)..."
                searchPlaceholder="Search dispatch lorry plate..."
                allowCustom={true}
                disabled={isSaving}
              />
            )}
          />
        </div>

        {/* Outward Weight */}
        <div>
          <Controller
            name="outward_weight"
            control={control}
            render={({ field }) => (
              <WeightInputField
                label="OUTWARD DISPATCHED WEIGHT"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.outward_weight?.message}
                disabled={isSaving}
                placeholder="0.000"
                hint="Dispatched MT cleared at exit gate"
              />
            )}
          />
        </div>
      </div>

      {/* Row 2: Gate Reconciliation Status */}
      <div>
        <GateReconciliationDisplay
          totalWeight={totalWeight}
          outwardWeight={outwardNum}
          dispatchVariance={dispatchVariance}
        />
      </div>
    </FormSection>
  )
}

export default OutwardSection
