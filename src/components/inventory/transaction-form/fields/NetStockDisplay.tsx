import { cn } from '@lib/utils'
import { CheckCircle2, ArrowUpRight, ArrowDownRight, Scale } from 'lucide-react'

export interface GateReconciliationDisplayProps {
  totalWeight?: number
  outwardWeight?: number
  dispatchVariance?: number
  netStock?: number
}

export function GateReconciliationDisplay({
  totalWeight = 0,
  outwardWeight = 0,
  dispatchVariance,
}: GateReconciliationDisplayProps) {
  // If dispatchVariance is not explicitly provided, calculate it: outward - totalWeight
  const variance =
    dispatchVariance !== undefined
      ? dispatchVariance
      : Math.round((outwardWeight - totalWeight) * 1000) / 1000

  const hasEnteredOutward = outwardWeight > 0
  const isReconciled = totalWeight > 0 && hasEnteredOutward && variance === 0
  const isUnderDispatched = totalWeight > 0 && hasEnteredOutward && variance < 0
  const isOverload = totalWeight > 0 && hasEnteredOutward && variance > 0
  const isPending = !hasEnteredOutward

  return (
    <div className="space-y-1.5 select-none">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
          <Scale className="h-3.5 w-3.5 text-zinc-600" />
          <span>OUTWARD DISPATCH &amp; GATE RECONCILIATION</span>
        </label>
        <span className="text-xs text-zinc-400 italic">Formula: Outward &minus; Total Load</span>
      </div>

      <div
        className={cn(
          'w-full rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-2xs',
          isReconciled && 'border-emerald-200/90 bg-emerald-50/70 text-emerald-900',
          isUnderDispatched && 'border-amber-200/90 bg-amber-50/80 text-amber-900',
          isOverload && 'border-blue-200/90 bg-blue-50/80 text-blue-900',
          isPending && 'border-zinc-200 bg-zinc-50/70 text-zinc-700'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isReconciled && (
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 shadow-2xs">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
          {isUnderDispatched && (
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shrink-0 shadow-2xs">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          )}
          {isOverload && (
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 shadow-2xs">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          )}
          {isPending && (
            <div className="p-1.5 rounded-lg bg-zinc-200/80 text-zinc-600 shrink-0 shadow-2xs">
              <Scale className="h-4 w-4" />
            </div>
          )}

          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-semibold block truncate">
              {isReconciled
                ? '✓ Reconciled / Full Load Cleared'
                : isUnderDispatched
                ? '▲ Under-Dispatched / Discrepancy'
                : isOverload
                ? '▼ Overload / Additional Dispatch'
                : 'Pending Gate Dispatch'}
            </span>
            <span
              className={cn(
                'text-[11px] block truncate',
                isReconciled && 'text-emerald-700',
                isUnderDispatched && 'text-amber-700',
                isOverload && 'text-blue-700',
                isPending && 'text-zinc-500'
              )}
            >
              {isReconciled
                ? `Outward weight exactly clears total load (${totalWeight.toFixed(3)} MT)`
                : isUnderDispatched
                ? `Outward weight is less than total onboard load by ${Math.abs(variance).toFixed(3)} MT`
                : isOverload
                ? `Outward weight exceeds onboard load by +${variance.toFixed(3)} MT`
                : totalWeight > 0
                ? `Total loadable weight ready: ${totalWeight.toFixed(3)} MT`
                : 'Enter inward and godown weights above'}
            </span>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0 sm:pl-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200/60">
          <span
            className={cn(
              'font-mono font-bold text-base sm:text-lg block leading-tight',
              isReconciled && 'text-emerald-800',
              isUnderDispatched && 'text-amber-800',
              isOverload && 'text-blue-800',
              isPending && 'text-zinc-700'
            )}
          >
            {variance > 0 ? `+${variance.toFixed(3)}` : variance.toFixed(3)} MT
          </span>
          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
            Gate Variance
          </span>
        </div>
      </div>
    </div>
  )
}

export default GateReconciliationDisplay
