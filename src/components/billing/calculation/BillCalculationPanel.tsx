import { BarChart3 } from 'lucide-react'
import { BillingTypeBadge } from './BillingTypeBadge'
import { RateBreakdownSection } from './RateBreakdownSection'
import { QuantitySection } from './QuantitySection'
import { RTGSAmountDisplay } from './RTGSAmountDisplay'
import { BillFormProgress } from './BillFormProgress'
import type { BillEntry } from '@types'

export interface BillCalculationPanelProps {
  quantityMt: number | ''
  billRate: number | ''
  actualRate: number | ''
  calculation: {
    quantity_kg: number
    rate_difference: number
    rtgs_amount: number
    billing_type: BillEntry['billing_type']
  }
  filledFieldsCount: number
}

export function BillCalculationPanel({
  quantityMt,
  billRate,
  actualRate,
  calculation,
  filledFieldsCount,
}: BillCalculationPanelProps) {
  const hasInput =
    typeof quantityMt === 'number' &&
    quantityMt > 0 &&
    typeof billRate === 'number' &&
    billRate > 0 &&
    typeof actualRate === 'number' &&
    actualRate > 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden select-none">
      {/* Panel Top Strip */}
      <div className="bg-amber-600 px-5 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-white/80" />
          <h3 className="text-sm font-semibold tracking-wide">Live Calculation</h3>
        </div>

        <span className="flex items-center gap-1.5 text-xs text-amber-100 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      <div className="p-5 space-y-4 divide-y divide-slate-100">
        {/* 1. Billing Type Badge */}
        <div>
          <BillingTypeBadge
            billingType={calculation.billing_type}
            hasInput={hasInput}
          />
        </div>

        {/* 2. Rate Breakdown */}
        <div className="pt-4">
          <RateBreakdownSection
            billRate={billRate}
            actualRate={actualRate}
            rateDifference={calculation.rate_difference}
            hasInput={hasInput}
          />
        </div>

        {/* 3. Consignment Weight / Quantity */}
        <div className="pt-4">
          <QuantitySection quantityMt={quantityMt} />
        </div>

        {/* 4. Hero RTGS / Adjustment Amount Display */}
        <div className="pt-4">
          <RTGSAmountDisplay
            rtgsAmount={calculation.rtgs_amount}
            rateDifference={calculation.rate_difference}
            quantityKg={calculation.quantity_kg}
            billingType={calculation.billing_type}
            hasInput={hasInput}
          />
        </div>

        {/* 5. Form Completion Progress */}
        <div className="pt-4">
          <BillFormProgress filledCount={filledFieldsCount} />
        </div>
      </div>
    </div>
  )
}

export default BillCalculationPanel
