import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  FileText,
  Plus,
  Receipt,
  Calendar,
  Building2,
  Truck,
  Layers,
} from 'lucide-react'
import { formatCurrency, formatMT, formatRate, formatKG } from '@lib/billCalculations'
import { cn } from '@lib/utils'
import type { BillEntry } from '@types'

export interface BillSuccessCardProps {
  entry: BillEntry
  onAddAnother: () => void
}

export function BillSuccessCard({
  entry,
  onAddAnother,
}: BillSuccessCardProps) {
  const partyDisplayName =
    entry.parties?.party_name || entry.party_code || 'Unknown Party'
  const qualityDisplayName =
    entry.qualities?.quality_name || 'Material'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in-50 zoom-in-95 duration-200 select-none max-w-3xl mx-auto">
      {/* Animated Success Checkmark */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-600 shadow-2xs ring-8 ring-emerald-50 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Bill Entry Saved Successfully!
        </h3>
        <p className="text-xs sm:text-sm text-slate-500">
          Transaction record and RTGS adjustment calculations have been registered.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
        {/* Card Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            <span className="font-mono font-bold text-slate-900 text-sm">
              {entry.bill_number ? `Invoice #${entry.bill_number}` : 'Bill Entry'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{entry.bill_date}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Party:</span>
            <span className="font-semibold text-slate-800 truncate">
              <strong className="font-mono text-amber-700">{entry.party_code}</strong> &bull; {partyDisplayName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Quality:</span>
            <span className="font-semibold text-slate-800 truncate">
              {qualityDisplayName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-400">Lorry No:</span>
            <span className="font-mono font-semibold text-slate-800">
              {entry.lorry_number}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-slate-400">Quantity:</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatMT(entry.quantity_mt)} ({formatKG(entry.quantity_kg)})
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-slate-400">Bill Rate:</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatRate(entry.bill_rate)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <span className="text-slate-400">Actual Rate:</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatRate(entry.actual_rate)}
            </span>
          </div>
        </div>

        {/* RTGS Amount Highlight Box */}
        <div
          className={cn(
            'p-4 rounded-xl border text-center transition-all',
            entry.billing_type === 'under' && 'bg-orange-50/90 border-orange-200',
            entry.billing_type === 'over' && 'bg-red-50/90 border-red-200',
            entry.billing_type === 'exact' && 'bg-green-50/90 border-green-200'
          )}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            RTGS Settlement Amount
          </span>
          <div
            className={cn(
              'text-2xl sm:text-3xl font-black font-mono tracking-tight',
              entry.billing_type === 'under' && 'text-orange-600',
              entry.billing_type === 'over' && 'text-red-600',
              entry.billing_type === 'exact' && 'text-green-600'
            )}
          >
            {formatCurrency(Math.abs(entry.rtgs_amount))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-1 text-xs font-semibold">
            {entry.billing_type === 'under' && (
              <span className="text-orange-700 bg-orange-100/70 px-2 py-0.5 rounded-full">
                🟠 Under Billing &bull; Payment Pending
              </span>
            )}
            {entry.billing_type === 'over' && (
              <span className="text-red-700 bg-red-100/70 px-2 py-0.5 rounded-full">
                🔴 Over Billing &bull; Refund / Debit Note
              </span>
            )}
            {entry.billing_type === 'exact' && (
              <span className="text-green-700 bg-green-100/70 px-2 py-0.5 rounded-full">
                🟢 Exact Match &bull; No Adjustment Needed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Link
          to="/billing/list"
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <FileText className="w-4 h-4 text-slate-500" />
          <span>View Bill Sheet</span>
        </Link>

        <button
          type="button"
          onClick={onAddAnother}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Bill Entry</span>
        </button>
      </div>
    </div>
  )
}

export default BillSuccessCard
