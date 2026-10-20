import { cn } from '@lib/utils'

export interface RateBreakdownSectionProps {
  billRate: number | ''
  actualRate: number | ''
  rateDifference: number
  hasInput: boolean
}

export function RateBreakdownSection({
  billRate,
  actualRate,
  rateDifference,
  hasInput,
}: RateBreakdownSectionProps) {
  const bRate = typeof billRate === 'number' ? billRate : 0
  const aRate = typeof actualRate === 'number' ? actualRate : 0

  return (
    <div className="space-y-2.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
        Rate Breakdown
      </span>

      <div className="space-y-1.5 text-xs">
        {/* Bill Rate */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-400">Bill Rate (Invoice):</span>
          <span className="font-mono font-bold text-slate-800">
            {bRate > 0 ? `₹${bRate.toFixed(2)}/kg` : <span className="text-slate-300 font-normal">&mdash;</span>}
          </span>
        </div>

        {/* Actual Rate */}
        <div className="flex items-center justify-between py-1 border-b border-slate-50">
          <span className="text-slate-400">Actual Rate (RTGS):</span>
          <span className="font-mono font-bold text-slate-800">
            {aRate > 0 ? `₹${aRate.toFixed(2)}/kg` : <span className="text-slate-300 font-normal">&mdash;</span>}
          </span>
        </div>

        {/* Divider */}
        <div className="pt-1">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-semibold text-slate-500">Difference / kg:</span>
            <span
              className={cn(
                'font-mono font-black text-sm',
                !hasInput && 'text-slate-300 font-normal',
                hasInput && rateDifference > 0 && 'text-orange-600',
                hasInput && rateDifference < 0 && 'text-red-600',
                hasInput && rateDifference === 0 && 'text-green-600'
              )}
            >
              {hasInput ? (
                <>
                  {rateDifference > 0 ? '+' : ''}
                  ₹{rateDifference.toFixed(2)}/kg
                </>
              ) : (
                '&mdash;'
              )}
            </span>
          </div>

          {hasInput && (
            <p className="text-[10px] text-slate-400 italic text-right mt-0.5">
              {rateDifference > 0 && 'Supplier billed LESS than actual rate'}
              {rateDifference < 0 && 'Supplier billed MORE than actual rate'}
              {rateDifference === 0 && 'Invoice rate equals agreed rate'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default RateBreakdownSection
