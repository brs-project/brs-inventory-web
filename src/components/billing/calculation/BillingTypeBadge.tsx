import { TrendingDown, TrendingUp, CheckCircle, HelpCircle } from 'lucide-react'
import type { BillEntry } from '@types'

export interface BillingTypeBadgeProps {
  billingType: BillEntry['billing_type']
  hasInput: boolean
}

export function BillingTypeBadge({
  billingType,
  hasInput,
}: BillingTypeBadgeProps) {
  if (!hasInput) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2.5 text-slate-400">
        <HelpCircle className="w-4 h-4 shrink-0 text-slate-300" />
        <span className="text-xs italic font-medium">
          Enter quantity and rates to calculate adjustment
        </span>
      </div>
    )
  }

  if (billingType === 'under') {
    return (
      <div className="bg-orange-50/90 border border-orange-200 rounded-xl p-3 flex items-start gap-2.5 transition-all animate-in fade-in duration-200">
        <div className="p-1 rounded-lg bg-orange-500/10 text-orange-600 shrink-0 mt-0.5">
          <TrendingDown className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wide flex items-center gap-1.5">
            <span>&uarr; UNDER BILLING</span>
          </h4>
          <p className="text-[11px] text-orange-600 font-medium mt-0.5">
            Supplier billed less than actual rate &mdash; RTGS payment required
          </p>
        </div>
      </div>
    )
  }

  if (billingType === 'over') {
    return (
      <div className="bg-red-50/90 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 transition-all animate-in fade-in duration-200">
        <div className="p-1 rounded-lg bg-red-500/10 text-red-600 shrink-0 mt-0.5">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-1.5">
            <span>&darr; OVER BILLING</span>
          </h4>
          <p className="text-[11px] text-red-600 font-medium mt-0.5">
            Billed more than actual rate &mdash; adjustment / credit note required
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50/90 border border-green-200 rounded-xl p-3 flex items-start gap-2.5 transition-all animate-in fade-in duration-200">
      <div className="p-1 rounded-lg bg-green-500/10 text-green-600 shrink-0 mt-0.5">
        <CheckCircle className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-green-800 uppercase tracking-wide flex items-center gap-1.5">
          <span>= EXACT MATCH</span>
        </h4>
        <p className="text-[11px] text-green-600 font-medium mt-0.5">
          Bill rate matches actual rate &mdash; no adjustment needed
        </p>
      </div>
    </div>
  )
}

export default BillingTypeBadge
