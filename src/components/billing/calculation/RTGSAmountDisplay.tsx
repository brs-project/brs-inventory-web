import { formatCurrency } from '@lib/billCalculations'
import { cn } from '@lib/utils'
import type { BillEntry } from '@types'

export interface RTGSAmountDisplayProps {
  rtgsAmount: number
  rateDifference: number
  quantityKg: number
  billingType: BillEntry['billing_type']
  hasInput: boolean
}

export function RTGSAmountDisplay({
  rtgsAmount,
  rateDifference,
  quantityKg,
  billingType,
  hasInput,
}: RTGSAmountDisplayProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          RTGS / Settlement Amount
        </span>
        <span className="text-[10px] font-mono text-slate-400">Net Adjustment</span>
      </div>

      <div
        className={cn(
          'p-4 rounded-xl border text-center transition-all duration-300 select-none shadow-2xs',
          !hasInput && 'bg-slate-50 border-slate-200 text-slate-400',
          hasInput && billingType === 'under' && 'bg-orange-50/80 border-orange-200',
          hasInput && billingType === 'over' && 'bg-red-50/80 border-red-200',
          hasInput && billingType === 'exact' && 'bg-green-50/80 border-green-200'
        )}
      >
        <span className="text-[11px] font-bold uppercase tracking-wide block mb-1 text-slate-400">
          Total Payable / Refund
        </span>

        {/* Hero Number */}
        <div
          className={cn(
            'text-3xl sm:text-4xl font-black font-mono tracking-tight leading-tight py-1 transition-all duration-200',
            !hasInput && 'text-slate-300 font-normal',
            hasInput && billingType === 'under' && 'text-orange-600',
            hasInput && billingType === 'over' && 'text-red-600',
            hasInput && billingType === 'exact' && 'text-green-600'
          )}
        >
          {hasInput ? (
            formatCurrency(Math.abs(rtgsAmount))
          ) : (
            '₹—'
          )}
        </div>

        {/* Formula calculation breakdown */}
        {hasInput ? (
          <div className="space-y-1 mt-1.5 pt-2 border-t border-slate-200/50">
            <p className="text-xs font-mono font-medium text-slate-600">
              Formula: {rateDifference > 0 ? '+' : ''}₹{rateDifference.toFixed(2)}/kg &times; {quantityKg.toLocaleString()} KG
            </p>

            <div className="pt-0.5">
              {billingType === 'under' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-full">
                  💰 Pay via RTGS to Supplier
                </span>
              )}
              {billingType === 'over' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100/70 px-2 py-0.5 rounded-full">
                  ↩ Refund / Debit Note from Supplier
                </span>
              )}
              {billingType === 'exact' && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100/70 px-2 py-0.5 rounded-full">
                  ✓ Rates Equal &bull; No Adjustment Needed
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic mt-1">
            Enter bill rate, actual rate, and weight to calculate
          </p>
        )}
      </div>
    </div>
  )
}

export default RTGSAmountDisplay
