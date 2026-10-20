import { useState } from 'react'
import { ChevronDown, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@lib/billCalculations'
import { BillCalculationPanel } from './calculation/BillCalculationPanel'
import { cn } from '@lib/utils'
import type { BillEntry } from '@types'

export interface MobileCalcCollapsibleProps {
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

export function MobileCalcCollapsible({
  quantityMt,
  billRate,
  actualRate,
  calculation,
  filledFieldsCount,
}: MobileCalcCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false)

  const hasInput =
    typeof quantityMt === 'number' &&
    quantityMt > 0 &&
    typeof billRate === 'number' &&
    billRate > 0 &&
    typeof actualRate === 'number' &&
    actualRate > 0

  return (
    <div className="block xl:hidden bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-amber-600 text-white flex items-center justify-between cursor-pointer focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-white/80" />
          <span className="text-xs font-bold tracking-wide">Live Calculation</span>
        </div>

        <div className="flex items-center gap-2.5">
          {hasInput ? (
            <span
              className={cn(
                'px-2 py-0.5 rounded text-xs font-mono font-bold',
                calculation.billing_type === 'under' && 'bg-orange-950/40 text-orange-200',
                calculation.billing_type === 'over' && 'bg-red-950/40 text-red-200',
                calculation.billing_type === 'exact' && 'bg-emerald-950/40 text-emerald-200'
              )}
            >
              {formatCurrency(Math.abs(calculation.rtgs_amount))}
            </span>
          ) : (
            <span className="text-xs text-amber-100 font-mono">₹—</span>
          )}

          <ChevronDown
            className={cn(
              'w-4 h-4 text-white/80 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-150">
          <BillCalculationPanel
            quantityMt={quantityMt}
            billRate={billRate}
            actualRate={actualRate}
            calculation={calculation}
            filledFieldsCount={filledFieldsCount}
          />
        </div>
      )}
    </div>
  )
}

export default MobileCalcCollapsible
