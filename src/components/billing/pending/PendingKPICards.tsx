import { ShieldAlert, Clock, Scale } from 'lucide-react'
import { formatCurrency, formatMT } from '@lib/billCalculations'

export interface PendingKPISummary {
  totalOutstanding: number
  fullPendingAmount: number
  partialPendingAmount: number
  fullPendingCount: number
  partialPendingCount: number
  pendingEntriesCount: number
  underCount: number
  partialCount: number
  totalWeightMT: number
  totalWeightKG: number
  oldestPendingDays: number
  oldestPendingPartyCode?: string
  oldestPendingPartyName?: string
  oldestPendingAmount?: number
  freshCount?: number
  warningCount?: number
  criticalCount?: number
}

export interface PendingKPICardsProps {
  summary: PendingKPISummary
}

export function PendingKPICards({ summary }: PendingKPICardsProps) {
  const fresh = summary.freshCount ?? 0
  const warning = summary.warningCount ?? 0
  const critical = summary.criticalCount ?? 0

  const freshPct = summary.pendingEntriesCount > 0 ? (fresh / summary.pendingEntriesCount) * 100 : 0
  const warningPct = summary.pendingEntriesCount > 0 ? (warning / summary.pendingEntriesCount) * 100 : 0
  const criticalPct = summary.pendingEntriesCount > 0 ? (critical / summary.pendingEntriesCount) * 100 : 0

  const avgPerSlip =
    summary.pendingEntriesCount > 0 ? summary.totalOutstanding / summary.pendingEntriesCount : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-stretch">
      {/* 1. HERO LIABILITY CARD (Col 1-5) */}
      <div className="lg:col-span-5 bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]/50 border border-[#FDE68A] rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-300/20 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900/80 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
              <span>TOTAL UNSETTLED RTGS</span>
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-amber-200/80 text-amber-900 border border-amber-300/60 font-mono">
              LIABILITY
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-[34px] font-bold font-mono text-amber-950 tracking-tight tabular-nums">
              {formatCurrency(summary.totalOutstanding)}
            </div>
            <div className="text-xs text-amber-900/70 mt-0.5">
              Outstanding under-billing differences & partial balances
            </div>
          </div>
        </div>

        {/* Breakdown sub-row */}
        <div className="pt-4 mt-4 border-t border-amber-200/80 flex flex-wrap items-center gap-2 relative z-10">
          <div className="bg-amber-100/90 hover:bg-amber-100 text-amber-950 border border-amber-300/80 rounded-full px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-600 inline-block shrink-0" />
            <span>
              <strong>{summary.underCount}</strong> Under Billing (
              <span className="font-mono font-semibold">{formatCurrency(summary.fullPendingAmount)}</span>)
            </span>
          </div>

          <div className="bg-amber-100/90 hover:bg-amber-100 text-amber-950 border border-amber-300/80 rounded-full px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600 inline-block shrink-0" />
            <span>
              <strong>{summary.partialCount}</strong> Partial (
              <span className="font-mono font-semibold">{formatCurrency(summary.partialPendingAmount)}</span>)
            </span>
          </div>
        </div>
      </div>

      {/* 2. AGING RISK PROFILE CARD (Col 6-9) */}
      <div className="lg:col-span-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>AGING RISK PROFILE</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {summary.pendingEntriesCount} active {summary.pendingEntriesCount === 1 ? 'slip' : 'slips'}
            </span>
          </div>

          {/* Stacked Risk Meter Bar */}
          <div className="space-y-1.5">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
              {summary.pendingEntriesCount > 0 ? (
                <>
                  {freshPct > 0 && (
                    <div
                      style={{ width: `${freshPct}%` }}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      title={`Fresh (<7d): ${fresh} slips`}
                    />
                  )}
                  {warningPct > 0 && (
                    <div
                      style={{ width: `${warningPct}%` }}
                      className="bg-amber-500 h-full rounded-full transition-all duration-300"
                      title={`Moderate (7-15d): ${warning} slips`}
                    />
                  )}
                  {criticalPct > 0 && (
                    <div
                      style={{ width: `${criticalPct}%` }}
                      className="bg-red-500 h-full rounded-full transition-all duration-300"
                      title={`Overdue (>15d): ${critical} slips`}
                    />
                  )}
                </>
              ) : (
                <div className="bg-slate-200 h-full w-full rounded-full" />
              )}
            </div>

            {/* Risk Breakdown Counts */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] text-red-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" />
                  <span>&gt;15d Overdue</span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm">{critical}</div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                  <span>7–15d Moderate</span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm">{warning}</div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  <span>&lt;7d Fresh</span>
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm">{fresh}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Oldest Pending Callout */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Oldest Pending:</span>
          {summary.oldestPendingDays > 0 ? (
            <span className="font-medium text-slate-800 flex items-center gap-1">
              <strong className="font-mono font-bold text-red-600">{summary.oldestPendingDays} days</strong>
              {summary.oldestPendingPartyCode && (
                <span className="text-slate-500">
                  · <span className="font-mono font-semibold text-slate-700">{summary.oldestPendingPartyCode}</span>
                </span>
              )}
            </span>
          ) : (
            <span className="text-emerald-600 font-medium">0 days · Clear</span>
          )}
        </div>
      </div>

      {/* 3. VOLUME & BATCH CARD (Col 10-12) */}
      <div className="lg:col-span-3 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-slate-400" />
              <span>VOLUME & BATCH</span>
            </span>
          </div>

          <div>
            <div className="text-2xl sm:text-[28px] font-bold font-mono text-slate-900 tracking-tight tabular-nums">
              {formatMT(summary.totalWeightMT)}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {summary.pendingEntriesCount} Supplier Slips
            </div>
          </div>
        </div>

        {/* Avg metric row */}
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Avg per slip:</span>
          <span className="font-mono font-semibold text-slate-800">
            {formatCurrency(avgPerSlip)}
          </span>
        </div>
      </div>
    </div>
  )
}
