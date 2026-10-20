import { formatCurrency, formatMT, formatKG } from '@lib/billCalculations'
import { cn } from '@lib/utils'
import type { BillSummary } from '@types'
import { TrendingUp, TrendingDown, CheckCircle2, FileSpreadsheet, Scale } from 'lucide-react'

export interface BillSummaryBarProps {
  summary: BillSummary
  className?: string
  onSelectCategory?: (category: 'all' | 'under' | 'over' | 'exact') => void
  activeCategory?: 'all' | 'under' | 'over' | 'exact'
}

export function BillSummaryBar({
  summary,
  className,
  onSelectCategory,
  activeCategory = 'all',
}: BillSummaryBarProps) {
  const isNetPayable = summary.netRtgsPayable > 0
  const isNetRefund = summary.netRtgsPayable < 0

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] gap-3 select-none', className)}>
      {/* 1. HERO BENTO CARD: NET RTGS (Spans 2 rows on desktop) */}
      <div
        onClick={() => onSelectCategory?.('all')}
        className={cn(
          'relative overflow-hidden rounded-2xl p-5 sm:p-6 lg:row-span-2 transition-all duration-200 cursor-pointer border flex flex-col justify-between shadow-xs hover:shadow-md',
          isNetPayable &&
            'bg-gradient-to-br from-[#FFF3E8] via-[#FFF0E2] to-[#FFEBDA] border-[#FED7AA]/70 text-orange-950',
          isNetRefund &&
            'bg-gradient-to-br from-[#FEF0F0] via-[#FEE8E8] to-[#FEE5E5] border-[#FECACA]/70 text-red-950',
          !isNetPayable &&
            !isNetRefund &&
            'bg-gradient-to-br from-[#ECFDF5] via-[#E6FAF0] to-[#DEFBEE] border-[#A7F3D0]/70 text-emerald-950'
        )}
      >
        {/* Subtle Decorative Arc Glow */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/40 blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          {isNetPayable && <TrendingUp className="w-24 h-24 text-orange-700" />}
          {isNetRefund && <TrendingDown className="w-24 h-24 text-red-700" />}
          {!isNetPayable && !isNetRefund && <CheckCircle2 className="w-24 h-24 text-emerald-700" />}
        </div>

        <div>
          {/* Label */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-[11px] font-bold uppercase tracking-widest',
                isNetPayable && 'text-orange-800/80',
                isNetRefund && 'text-red-800/80',
                !isNetPayable && !isNetRefund && 'text-emerald-800/80'
              )}
            >
              {isNetPayable && 'NET RTGS PAYABLE'}
              {isNetRefund && 'NET RTGS REFUND'}
              {!isNetPayable && !isNetRefund && 'NET BALANCE (EXACT)'}
            </span>

            <span className="text-[11px] font-medium text-[#17181A]/50 bg-white/60 px-2 py-0.5 rounded-full border border-black/5">
              Ledger Summary
            </span>
          </div>

          {/* Amount */}
          <div
            className={cn(
              'text-3xl sm:text-4xl font-bold font-mono tracking-tight mt-2',
              isNetPayable && 'text-orange-800',
              isNetRefund && 'text-red-700',
              !isNetPayable && !isNetRefund && 'text-emerald-700'
            )}
          >
            {formatCurrency(Math.abs(summary.netRtgsPayable))}
          </div>

          <p className="text-xs text-orange-900/70 mt-1 font-medium">
            {isNetPayable && '• Net outstanding amount required to settle suppliers'}
            {isNetRefund && '• Net credit adjustment / refund balance'}
            {!isNetPayable && !isNetRefund && '• All billed rates perfectly match agreed rates'}
          </p>
        </div>

        {/* Breakdown Meta Chips */}
        <div className="mt-4 pt-3.5 border-t border-black/5 flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectCategory?.('under')
            }}
            className={cn(
              'px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-all shadow-2xs',
              activeCategory === 'under'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white/80 text-orange-700 hover:bg-white border border-orange-200/60'
            )}
          >
            <TrendingUp className="w-3 h-3" />
            <span>↑ {summary.underBillingCount} under</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectCategory?.('over')
            }}
            className={cn(
              'px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-all shadow-2xs',
              activeCategory === 'over'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white/80 text-red-600 hover:bg-white border border-red-200/60'
            )}
          >
            <TrendingDown className="w-3 h-3" />
            <span>↓ {summary.overBillingCount} over</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelectCategory?.('exact')
            }}
            className={cn(
              'px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-all shadow-2xs',
              activeCategory === 'exact'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/80 text-emerald-700 hover:bg-white border border-emerald-200/60'
            )}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>✓ {summary.exactBillingCount} exact</span>
          </button>
        </div>
      </div>

      {/* 2. SMALL BENTO CARD: TOTAL BILLS */}
      <div
        onClick={() => onSelectCategory?.('all')}
        className={cn(
          'bg-white rounded-2xl p-4 border border-[#ECECEE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between',
          activeCategory === 'all' && 'ring-1.5 ring-[#17181A]/20 bg-[#FCFCFD]'
        )}
      >
        <div className="flex items-center justify-between text-gray-400">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A6A8AE]">
            Total Bills
          </span>
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#A6A8AE]" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-[#17181A] tracking-tight">
            {summary.totalEntries}
          </div>
          <div className="text-[11px] text-[#6E7076] mt-0.5">
            Recorded consignment entries
          </div>
        </div>
        <div className="text-[10px] font-medium text-[#A6A8AE] flex items-center gap-1">
          <span>Avg rate: ₹{summary.avgBillRate.toFixed(2)}/kg</span>
        </div>
      </div>

      {/* 3. SMALL BENTO CARD: TOTAL WEIGHT */}
      <div className="bg-white rounded-2xl p-4 border border-[#ECECEE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-400">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A6A8AE]">
            Total Weight
          </span>
          <Scale className="w-3.5 h-3.5 text-[#A6A8AE]" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-[#17181A] tracking-tight">
            {formatMT(summary.totalQuantityMT)}
          </div>
          <div className="text-[11px] text-[#6E7076] mt-0.5">
            = {formatKG(summary.totalQuantityKG)}
          </div>
        </div>
        <div className="text-[10px] font-medium text-[#A6A8AE]">
          Material traded
        </div>
      </div>

      {/* 4. SMALL BENTO CARD: UNDER BILLING */}
      <div
        onClick={() => onSelectCategory?.('under')}
        className={cn(
          'bg-white rounded-2xl p-4 border border-[#ECECEE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between',
          activeCategory === 'under' && 'ring-1.5 ring-orange-500/30 bg-orange-50/20'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A6A8AE]">
            Under Billing
          </span>
          <span className="w-2 h-2 rounded-full bg-orange-500" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-orange-600 tracking-tight">
            {formatCurrency(summary.totalUnderBillingAmount)}
          </div>
          <div className="text-[11px] text-[#6E7076] mt-0.5">
            {summary.underBillingCount} consignments (Pay diff)
          </div>
        </div>
        <div className="text-[10px] font-medium text-orange-600/80">
          RTGS payable to parties
        </div>
      </div>

      {/* 5. SMALL BENTO CARD: OVER BILLING */}
      <div
        onClick={() => onSelectCategory?.('over')}
        className={cn(
          'bg-white rounded-2xl p-4 border border-[#ECECEE] shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex flex-col justify-between',
          activeCategory === 'over' && 'ring-1.5 ring-red-500/30 bg-red-50/20'
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#A6A8AE]">
            Over Billing
          </span>
          <span className="w-2 h-2 rounded-full bg-red-500" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-red-500 tracking-tight">
            {formatCurrency(Math.abs(summary.totalOverBillingAmount))}
          </div>
          <div className="text-[11px] text-[#6E7076] mt-0.5">
            {summary.overBillingCount} consignments (Refund)
          </div>
        </div>
        <div className="text-[10px] font-medium text-red-500/80">
          Debit memo / refund
        </div>
      </div>
    </div>
  )
}

export default BillSummaryBar
