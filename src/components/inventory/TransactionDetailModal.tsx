import { formatISTDate, formatISTDateTime } from '@lib/dateUtils'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  Printer,
  Pencil,
  Trash2,
  Scale,
  Building2,
  ArrowDown,
  Plus,
} from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { cn } from '@lib/utils'
import type { InventoryTransaction } from '@types'

export interface TransactionDetailModalProps {
  open: boolean
  onClose: () => void
  transaction: InventoryTransaction | null
  onDelete?: (txn: InventoryTransaction) => void
}

export function TransactionDetailModal({
  open,
  onClose,
  transaction,
  onDelete,
}: TransactionDetailModalProps) {
  const { user } = useAuth()
  const canDelete = user?.role === 'admin' || user?.role === 'manager'

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !transaction) return null

  const handlePrint = () => {
    window.print()
  }

    const party = transaction.parties
  const quality = transaction.qualities

  const inWeight = transaction.inward_weight || 0
  const gdWeight = transaction.godown_weight || 0
  const totalWeight =
    transaction.total_weight !== undefined
      ? transaction.total_weight
      : Math.round((inWeight + gdWeight) * 1000) / 1000
  const outWeight = transaction.outward_weight || 0
  const dispatchVariance =
    transaction.dispatch_variance !== undefined
      ? transaction.dispatch_variance
      : Math.round((outWeight - totalWeight) * 1000) / 1000

  const isReconciled = totalWeight > 0 && outWeight > 0 && dispatchVariance === 0
  const isUnderDispatched = totalWeight > 0 && outWeight > 0 && dispatchVariance < 0
  const isOverload = totalWeight > 0 && outWeight > 0 && dispatchVariance > 0

  return (
    <div className="fixed inset-0 z-50 select-none print:p-0 print:static">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 z-40 print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-In Drawer Panel from Right */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white shadow-2xl border-l border-zinc-200 z-50 overflow-hidden flex flex-col animate-in slide-in-from-right duration-250 print:static print:w-full print:border-none print:shadow-none">
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-start justify-between bg-white shrink-0">
          <div className="space-y-1 min-w-0 pr-2">
            <h2 className="text-base font-bold text-zinc-900 truncate">
              Weighbridge Transaction
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-zinc-700">
                {transaction.bill_number || transaction.id.slice(0, 12)}
              </span>
              <span className="text-zinc-300">&bull;</span>
              <span className="text-xs text-zinc-500 font-medium">
                {formatISTDate(transaction.transaction_date)}
              </span>
              <span className="text-zinc-300">&bull;</span>
              {/* Status Badge */}
              {transaction.status === 'completed' && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.2 rounded-full">
                  ✓ Done
                </span>
              )}
              {transaction.status === 'draft' && (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.2 rounded-full">
                  ◌ Draft
                </span>
              )}
              {transaction.status === 'cancelled' && (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.2 rounded-full">
                  ✕ Void
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition cursor-pointer shrink-0 print:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 text-xs">
          {/* Section 1: Party & Material Spec */}
          <div className="px-5 py-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              PARTY &amp; COMMODITY
            </h3>

            <div className="flex justify-between items-start py-0.5">
              <span className="text-zinc-400 w-28 shrink-0 font-medium">From Party:</span>
              <div className="text-right flex-1 min-w-0">
                <span className="font-semibold text-zinc-900 block truncate">
                  {party?.party_name || transaction.party_id}
                </span>
                {party?.party_code && (
                  <span className="text-[10px] font-mono text-zinc-400 block">
                    {party.party_code}
                    {party.city ? ` • ${party.city}` : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start py-0.5">
              <span className="text-zinc-400 w-28 shrink-0 font-medium">Quality Spec:</span>
              <div className="text-right flex-1 flex items-center justify-end gap-1.5">
                <span className="font-semibold text-zinc-900">
                  {quality?.quality_name || transaction.quality_id}
                </span>
                {quality?.category && (
                  <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase px-1.5 py-0.2 rounded">
                    {quality.category}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-start py-0.5">
              <span className="text-zinc-400 w-28 shrink-0 font-medium">Storage Bay:</span>
              <span className="font-medium text-zinc-800 text-right flex-1">
                {transaction.godowns?.godown_name || 'Main Yard / Direct Bay'}
              </span>
            </div>

            <div className="flex justify-between items-start py-0.5">
              <span className="text-zinc-400 w-28 shrink-0 font-medium">Bill / Inv Ref:</span>
              <span className="font-mono font-semibold text-zinc-900 text-right flex-1">
                {transaction.bill_number || '—'}
              </span>
            </div>
          </div>

          {/* Section 2: Consignment Weight Calculation Desk */}
          <div className="px-5 py-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-indigo-600" />
              <span>YARD LOADING &amp; CONSIGNMENT</span>
            </h3>

            {/* Inward Receipt */}
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium flex items-center gap-1">
                  <ArrowDown className="h-3.5 w-3.5 text-blue-600" />
                  <span>Inward Weight:</span>
                </span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  {inWeight.toFixed(3)} MT
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-medium flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Loaded from Godown:</span>
                </span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  +{gdWeight.toFixed(3)} MT
                </span>
              </div>

              <div className="border-t border-zinc-200 pt-2 flex justify-between items-center">
                <span className="text-zinc-700 font-bold flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Total Vehicle Load:</span>
                </span>
                <span className="font-mono font-bold text-indigo-700 text-sm">
                  {totalWeight.toFixed(3)} MT
                </span>
              </div>
            </div>

            {/* Inward Transport */}
            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-400 w-28 shrink-0 font-medium">Inward Lorry:</span>
              <span className="font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200/70">
                {transaction.vehicles_in?.lorry_number || transaction.vehicle_in_id || '—'}
              </span>
            </div>
          </div>

          {/* Section 3: Outward & Gate Reconciliation */}
          <div className="px-5 py-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              OUTWARD DISPATCH &amp; RECONCILIATION
            </h3>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-400 w-28 shrink-0 font-medium">Outward Lorry:</span>
              <span className="font-mono font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200/70">
                {transaction.vehicles_out?.lorry_number || transaction.vehicle_out_id || '—'}
              </span>
            </div>

            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-400 w-28 shrink-0 font-medium">Outward Wt:</span>
              <span className="font-mono font-bold text-amber-600 text-sm">
                {outWeight.toFixed(3)} MT
              </span>
            </div>

            {/* Reconciliation Box */}
            <div
              className={cn(
                'p-3 rounded-xl border flex items-center justify-between',
                isReconciled && 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
                isUnderDispatched && 'bg-amber-50/80 border-amber-200 text-amber-900',
                isOverload && 'bg-blue-50/80 border-blue-200 text-blue-900',
                !outWeight && 'bg-zinc-50 border-zinc-200 text-zinc-700'
              )}
            >
              <div className="space-y-0.5">
                <span className="font-bold text-xs block">
                  {isReconciled
                    ? '✓ Gate Reconciled'
                    : isUnderDispatched
                    ? '▲ Under-Dispatched'
                    : isOverload
                    ? '▼ Overload Dispatch'
                    : 'Pending Dispatch'}
                </span>
                <span className="text-[10px] opacity-80 block">
                  Outward &minus; Total Load
                </span>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-sm block">
                  {dispatchVariance > 0 ? `+${dispatchVariance.toFixed(3)}` : dispatchVariance.toFixed(3)} MT
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Remarks */}
          {transaction.remarks && (
            <div className="px-5 py-4 space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                REMARKS &amp; AUDIT NOTES
              </h3>
              <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-200/70 italic leading-relaxed">
                "{transaction.remarks}"
              </p>
              {transaction.created_at && <span className="text-[10px] text-zinc-400 font-mono block">Recorded: {formatISTDateTime(transaction.created_at)}</span>}
            </div>
          )}
        </div>

        {/* Panel Footer Actions */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/50 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            <span>Print Chit</span>
          </button>

          <div className="flex items-center gap-2">
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(transaction)}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Delete Transaction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <Link
              to={`/inventory/edit/${transaction.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-xs shadow-indigo-600/20 transition cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Entry</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionDetailModal
