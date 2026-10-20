import { formatISTDate, formatISTDateTime } from '@lib/dateUtils'
import { Eye, Edit2, CreditCard, Trash2 } from 'lucide-react'
import { formatCurrency } from '@lib/billCalculations'
import { cn } from '@lib/utils'
import type { BillEntry } from '@types'

export interface PendingTableRowProps {
  entry: BillEntry
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onView: (entry: BillEntry) => void
  onEdit: (entry: BillEntry) => void
  onDelete: (entry: BillEntry) => void
  onMarkAsPaid: (entry: BillEntry) => void
  agingDays: number
}

export function PendingTableRow({
  entry,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onDelete,
  onMarkAsPaid,
  agingDays,
}: PendingTableRowProps) {
  const isCritical = agingDays > 15
  const diff = entry.rate_difference
  const isUnder = diff > 0
  const isOver = diff < 0
  const isExact = diff === 0

  const partyCode = entry.party_code || entry.parties?.party_code || '—'
  const partyName = entry.parties?.party_name || 'Supplier'
  const qualityName = entry.qualities?.quality_name || '—'
  const qualityCategory = entry.qualities?.category

  // Age Risk Badge Styling
  const renderAgeBadge = () => {
    if (agingDays > 15) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-red-50 text-red-700 border border-red-200/80 whitespace-nowrap"
          title={`${agingDays} days overdue`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span>{agingDays}d</span>
        </span>
      )
    }
    if (agingDays >= 7) {
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap"
          title={`${agingDays} days moderate aging`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>{agingDays}d</span>
        </span>
      )
    }
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap"
        title={`${agingDays} days fresh`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
        <span>{agingDays}d</span>
      </span>
    )
  }

  return (
    <tr
      className={cn(
        'group border-b border-[#F0F1F3] transition-colors duration-100 select-none text-slate-700 text-xs',
        isSelected ? 'bg-amber-50/40' : 'bg-white hover:bg-slate-50/80',
        isCritical && !isSelected && 'hover:bg-red-50/20'
      )}
    >
      {/* 1. SELECTION CHECKBOX */}
      <td className="w-10 px-3 py-3 text-center">
        <input
          type="checkbox"
          aria-label={`Select bill ${entry.bill_number || entry.id}`}
          checked={isSelected}
          onChange={() => onToggleSelect(entry.id)}
          className="h-4 w-4 rounded border-[#D1D5DB] text-zinc-900 focus:ring-zinc-900 focus:ring-offset-0 cursor-pointer"
        />
      </td>

      {/* 2. AGING & RISK */}
      <td className="w-20 px-3 py-3 text-center">
        {renderAgeBadge()}
      </td>

      {/* 3. SUPPLIER / PARTY (Two-line stack) */}
      <td className="w-48 px-3 py-3">
        <div className="leading-tight space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-[13px] text-[#111827] tracking-tight">
              {partyCode}
            </span>
            {entry.bill_number && (
              <span className="text-[10.5px] font-mono text-slate-400">
                #{entry.bill_number}
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-[10.5px] font-mono text-slate-500" title={entry.created_at ? formatISTDateTime(entry.created_at) : undefined}>
              {formatISTDate(entry.bill_date)}
            </span>
          </div>
          <div className="text-xs text-[#4B5563] truncate max-w-[170px]" title={partyName}>
            {partyName}
          </div>
        </div>
      </td>

      {/* 4. MATERIAL & VEHICLE (Two-line stack) */}
      <td className="w-40 px-3 py-3">
        <div className="leading-tight space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#111827] whitespace-nowrap">
              {qualityName}
            </span>
            {qualityCategory && (
              <span className="inline-block bg-slate-100 text-slate-600 rounded text-[9.5px] font-medium px-1 py-0.2">
                {qualityCategory}
              </span>
            )}
          </div>
          <div>
            <span className="font-mono text-[10.5px] font-semibold text-[#4B5563] bg-[#F4F5F6] border border-[#E5E7EB] rounded px-1.5 py-0.5 uppercase tracking-wide inline-block whitespace-nowrap">
              {entry.lorry_number}
            </span>
          </div>
        </div>
      </td>

      {/* 5. CONSIGNMENT MT */}
      <td className="w-24 px-3 py-3 text-right">
        <div className="font-mono font-semibold text-[13.5px] text-[#111827] tabular-nums">
          {entry.quantity_mt.toFixed(3)}
          <span className="text-xs font-normal text-slate-400 ml-1">MT</span>
        </div>
      </td>

      {/* 6. RATE SPREAD (Bill → Actual) */}
      <td className="w-44 px-3 py-3 text-right">
        <div className="space-y-0.5">
          <div className="font-mono text-xs text-[#4B5563] tabular-nums">
            ₹{entry.bill_rate.toFixed(2)} → ₹{entry.actual_rate.toFixed(2)}
          </div>
          <div>
            {isUnder && (
              <span className="inline-block bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-mono font-semibold px-1.5 py-0.2 rounded-full">
                +₹{diff.toFixed(2)}/kg
              </span>
            )}
            {isOver && (
              <span className="inline-block bg-rose-50 border border-rose-200 text-rose-800 text-[10.5px] font-mono font-semibold px-1.5 py-0.2 rounded-full">
                -₹{Math.abs(diff).toFixed(2)}/kg
              </span>
            )}
            {isExact && (
              <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-mono font-semibold px-1.5 py-0.2 rounded-full">
                Exact ₹0.00
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 7. PAYABLE RTGS AMOUNT (Primary monetary column) */}
      <td className="w-36 px-3 py-3 text-right">
        <div className="space-y-0.5">
          <div className="font-mono font-bold text-[14px] text-amber-950 tabular-nums">
            {formatCurrency(Math.abs(entry.rtgs_amount))}
          </div>
          {entry.payment_status === 'partial' && (
            <span className="inline-block text-[10px] font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded-full border border-violet-200">
              Partial Balance
            </span>
          )}
        </div>
      </td>

      {/* 8. ACTION TRIGGER */}
      <td className="w-36 px-3 py-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {/* Quick Settle CTA */}
          <button
            type="button"
            onClick={() => onMarkAsPaid(entry)}
            className="px-2.5 py-1 bg-zinc-900 hover:bg-black text-white text-[11px] font-medium rounded-md transition-all flex items-center gap-1 shadow-2xs active:scale-95"
            title="Settle this slip via RTGS"
          >
            <CreditCard className="w-3 h-3" />
            <span>Settle</span>
          </button>

          {/* Inspect View Details */}
          <button
            type="button"
            onClick={() => onView(entry)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
            title="Edit Entry"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(entry)}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
            title="Delete Entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}
