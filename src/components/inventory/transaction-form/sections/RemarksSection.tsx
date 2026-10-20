import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { FormSection } from '../FormSection'
import type { TransactionFormData } from '../../TransactionForm'

export interface RemarksSectionProps {
  register: UseFormRegister<TransactionFormData>
  errors: FieldErrors<TransactionFormData>
  remarksValue?: string
  isSaving?: boolean
}

export function RemarksSection({
  register,
  errors,
  remarksValue = '',
  isSaving = false,
}: RemarksSectionProps) {
  const charCount = remarksValue?.length || 0

  return (
    <FormSection
      title="Section 4: Remarks & Audit Notes"
      subtitle="Additional context and weighbridge observations"
      dotColor="bg-violet-500"
      badgeText="OPTIONAL"
      badgeColor="bg-slate-100 text-slate-600 border border-slate-200/60"
    >
      <div className="space-y-1.5 select-none">
        <div className="flex items-center justify-between">
          <label
            htmlFor="remarks"
            className="text-xs font-medium text-slate-500 uppercase tracking-wide"
          >
            REMARKS &amp; NOTES <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <span className="text-xs text-slate-400 italic">Audit trail</span>
        </div>

        <textarea
          id="remarks"
          rows={3}
          disabled={isSaving}
          placeholder="Any additional weighbridge inspection notes, moisture deduction reasons, driver instructions, or stock observations..."
          {...register('remarks')}
          className="w-full px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors duration-150 resize-y disabled:bg-slate-50 disabled:text-slate-400"
        />

        <div className="flex items-center justify-between text-xs pt-0.5">
          {errors.remarks ? (
            <p className="text-red-500 font-medium">{errors.remarks.message}</p>
          ) : (
            <span className="text-slate-400">Moisture, tare weight, or quality notes</span>
          )}
          <span className="text-slate-400 font-mono ml-auto">
            {charCount} / 500 chars
          </span>
        </div>
      </div>
    </FormSection>
  )
}

export default RemarksSection
