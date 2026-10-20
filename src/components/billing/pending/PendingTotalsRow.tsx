import { formatCurrency } from '@lib/billCalculations'

export interface PendingTotalsRowProps {
  totalEntries: number
  totalQuantityMT: number
  avgRateDiff: number
  netRtgsAmount: number
}

export function PendingTotalsRow({
  totalEntries,
  totalQuantityMT,
  avgRateDiff,
  netRtgsAmount,
}: PendingTotalsRowProps) {
  return (
    <tfoot className="bg-[#F8F9FA] border-t-2 border-[#E5E7EB] select-none text-xs">
      <tr>
        {/* 1. Checkbox */}
        <td className="w-10 px-3 py-3"></td>

        {/* 2. Age */}
        <td className="w-20 px-3 py-3"></td>

        {/* 3. Supplier / Party */}
        <td className="w-48 px-3 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            TOTALS ({totalEntries} {totalEntries === 1 ? 'slip' : 'slips'})
          </div>
        </td>

        {/* 4. Quality & Vehicle */}
        <td className="w-40 px-3 py-3"></td>

        {/* 5. Consignment MT */}
        <td className="w-24 px-3 py-3 text-right">
          <div className="font-mono font-bold text-[#111827] text-[13.5px] tabular-nums">
            {totalQuantityMT.toFixed(3)}
            <span className="text-xs font-normal text-slate-400 ml-1">MT</span>
          </div>
        </td>

        {/* 6. Rate Spread */}
        <td className="w-44 px-3 py-3 text-right">
          <div className="font-mono text-xs font-semibold text-[#4B5563] tabular-nums">
            {avgRateDiff >= 0 ? '+' : ''}₹{avgRateDiff.toFixed(2)}
            <span className="text-[10px] font-normal text-slate-400 ml-1 uppercase">
              /kg avg
            </span>
          </div>
        </td>

        {/* 7. Net Payable RTGS Amount */}
        <td className="w-36 px-3 py-3 text-right">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-amber-900/70 block tracking-tight">
              NET PAYABLE:
            </span>
            <div className="font-mono font-bold text-amber-950 text-base tabular-nums">
              {formatCurrency(Math.abs(netRtgsAmount))}
            </div>
          </div>
        </td>

        {/* 8. Actions */}
        <td className="w-36 px-3 py-3"></td>
      </tr>
    </tfoot>
  )
}
