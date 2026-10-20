import { cn } from '@lib/utils'
import { Plus, Scale, Sparkles } from 'lucide-react'

export interface CombinedLoadBannerProps {
  inwardWeight: number
  godownWeight: number
  totalWeight: number
}

export function CombinedLoadBanner({
  inwardWeight = 0,
  godownWeight = 0,
  totalWeight = 0,
}: CombinedLoadBannerProps) {
  const hasMaterial = inwardWeight > 0 || godownWeight > 0

  return (
    <div className="space-y-1.5 select-none">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide flex items-center gap-1.5">
          <Scale className="h-3.5 w-3.5 text-indigo-600" />
          <span>COMBINED VEHICLE LOAD (ONBOARD LORRY)</span>
        </label>
        <span className="text-xs text-zinc-400 italic">Formula: Inward + Godown</span>
      </div>

      <div
        className={cn(
          'w-full rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-2xs',
          hasMaterial
            ? 'border-indigo-200/90 bg-indigo-50/60 text-indigo-950'
            : 'border-zinc-200 bg-zinc-50/80 text-zinc-600'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-100/80 text-indigo-700 shrink-0 shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-semibold block truncate">
              {hasMaterial ? 'Total Onboard Consignment' : 'Awaiting Weight Input'}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 flex-wrap">
              <span>Inward: <strong className="font-mono text-zinc-700">{inwardWeight.toFixed(3)} MT</strong></span>
              <span className="text-indigo-600 font-bold inline-flex items-center">
                <Plus className="h-3 w-3" />
              </span>
              <span>Godown: <strong className="font-mono text-zinc-700">{godownWeight.toFixed(3)} MT</strong></span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0 sm:pl-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-indigo-100">
          <span className="font-mono font-bold text-base sm:text-lg text-indigo-900 block leading-tight">
            {totalWeight.toFixed(3)} MT
          </span>
          <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">
            Total Loadable
          </span>
        </div>
      </div>
    </div>
  )
}

export default CombinedLoadBanner
