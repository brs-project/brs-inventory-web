import { Scale, Truck, Building2, Users } from 'lucide-react'
import type { DispatchSummary } from '@types'

export interface DispatchSummaryBarProps {
  summary: DispatchSummary
  dispatchedCount?: number
  draftCount?: number
  cancelledCount?: number
}

export function DispatchSummaryBar({
  summary,
  dispatchedCount,
  draftCount,
  cancelledCount,
}: DispatchSummaryBarProps) {
  const avgPayload =
    summary.uniqueLorries > 0
      ? (summary.totalBillWeight / summary.uniqueLorries).toFixed(2)
      : '0.00'

  const totalKg = (summary.totalBillWeight * 1000).toLocaleString('en-IN')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr] gap-3.5 items-stretch select-none">
      {/* 1. OUTWARD FREIGHT VOLUME HERO (Left, prominent) */}
      <div className="bg-gradient-to-br from-[#F0FDF4] via-[#DCFCE7]/70 to-[#BBF7D0]/40 border border-[#BBF7D0] rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-emerald-400/15 rounded-full blur-xl pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900/80 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-emerald-700" />
              <span>TOTAL OUTWARD BILLED WEIGHT</span>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-emerald-200/80 text-emerald-900 border border-emerald-300/60 font-mono">
              OUTWARD
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-[32px] font-bold font-mono tracking-tight text-emerald-950 tabular-nums">
              {summary.totalBillWeight.toFixed(3)}{' '}
              <span className="text-lg font-semibold text-emerald-800">MT</span>
            </div>
            <div className="text-xs text-emerald-900/70 mt-0.5 font-medium">
              ({totalKg} KG dispatched across all godowns)
            </div>
          </div>
        </div>

        {/* Bottom context pill */}
        <div className="pt-3 mt-3 border-t border-emerald-200/70 flex items-center justify-between text-xs text-emerald-900/80 relative z-10 font-medium">
          <span>Weighbridge Outward Ledger</span>
          <span className="font-mono font-semibold text-emerald-950">
            {summary.totalDispatches} total consignments
          </span>
        </div>
      </div>

      {/* 2. FLEET & CARRIER OPERATIONS (Middle) */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-slate-400" />
              <span>FLEET &amp; CARRIER OPERATIONS</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-0.5">
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {summary.uniqueLorries}
              </div>
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <span>Active Lorries</span>
              </div>
            </div>

            <div className="space-y-0.5 border-l border-slate-100 pl-3">
              <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                {summary.uniqueTransporters}
              </div>
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-slate-400" />
                <span>Transporters</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Average payload:</span>
          <span className="font-mono font-semibold text-slate-800">
            ~{avgPayload} MT / vehicle
          </span>
        </div>
      </div>

      {/* 3. CONSIGNMENT & COUNTERPARTY REACH (Right) */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span>CONSIGNMENTS &amp; BUYERS</span>
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-[26px] font-bold font-mono text-slate-900 tracking-tight tabular-nums">
              {summary.totalDispatches}{' '}
              <span className="text-sm font-semibold text-slate-500">Dispatches</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              across <strong className="text-slate-800 font-semibold">{summary.uniqueParties}</strong> Unique Buyers
            </div>
          </div>
        </div>

        {/* Status breakdown pills */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
          {dispatchedCount !== undefined ? (
            <>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 inline-block" />
                {dispatchedCount} Dispatched
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                {draftCount ?? 0} Draft
              </span>
              {cancelledCount !== undefined && cancelledCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/70 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                  {cancelledCount} Cancelled
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400">All registered dispatch logs</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default DispatchSummaryBar
