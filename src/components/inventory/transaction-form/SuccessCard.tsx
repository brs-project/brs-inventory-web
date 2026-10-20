import { Link } from 'react-router-dom'
import { CheckCircle2, List, Plus, Sparkles, FileText, ArrowDown, ArrowUp, Scale, Building2 } from 'lucide-react'
import { cn } from '@lib/utils'

export interface SuccessCardProps {
  billNumber: string
  transactionDate?: Date
  partyName?: string
  qualityName?: string
  inwardWeight?: number
  godownWeight?: number
  totalWeight?: number
  outwardWeight?: number
  dispatchVariance?: number
  lorryIn?: string
  lorryOut?: string
  netStock?: number
  onAddAnother: () => void
}

export function SuccessCard({
  billNumber,
  partyName,
  qualityName,
  inwardWeight = 0,
  godownWeight = 0,
  totalWeight: propTotalWeight,
  outwardWeight = 0,
  dispatchVariance: propDispatchVariance,
  lorryIn,
  lorryOut,
  onAddAnother,
}: SuccessCardProps) {
  const totalWeight =
    propTotalWeight !== undefined
      ? propTotalWeight
      : Math.round((inwardWeight + godownWeight) * 1000) / 1000

  const variance =
    propDispatchVariance !== undefined
      ? propDispatchVariance
      : Math.round((outwardWeight - totalWeight) * 1000) / 1000

  const isReconciled = totalWeight > 0 && outwardWeight > 0 && variance === 0
  const isUnderDispatched = totalWeight > 0 && outwardWeight > 0 && variance < 0
  const isOverload = totalWeight > 0 && outwardWeight > 0 && variance > 0

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-sm p-6 sm:p-10 max-w-2xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-200 select-none">
      {/* Animated Checkmark Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner animate-in zoom-in-50 duration-300">
          <CheckCircle2 className="h-9 w-9" />
        </div>
      </div>

      {/* Header Text */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Recorded to System Ledger</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
          Transaction Saved Successfully!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500">
          Weighbridge transaction and physical godown inventory updated in real-time.
        </p>
      </div>

      {/* Summary Details Card */}
      <div className="bg-zinc-50/90 rounded-xl border border-zinc-200 p-5 text-left text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-zinc-400" />
            <span className="text-zinc-500 font-medium">Invoice / Bill:</span>
            <span className="font-mono font-bold text-zinc-900">{billNumber}</span>
          </div>
          {partyName && (
            <span className="font-semibold text-zinc-700 truncate max-w-[200px]">
              {partyName}
            </span>
          )}
        </div>

        {/* 3-Part Weight Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Inward Details */}
          <div className="p-2.5 rounded-lg bg-white border border-zinc-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-[11px]">
              <ArrowDown className="h-3.5 w-3.5" />
              <span>Inward Receipt</span>
            </div>
            <span className="font-mono font-bold text-zinc-900 block text-sm">
              {inwardWeight.toFixed(3)} MT
            </span>
            {lorryIn && (
              <span className="text-[10px] text-zinc-400 block font-mono truncate">
                Lorry: {lorryIn}
              </span>
            )}
          </div>

          {/* Godown Loaded Details */}
          <div className="p-2.5 rounded-lg bg-white border border-zinc-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
              <Building2 className="h-3.5 w-3.5" />
              <span>Godown Added</span>
            </div>
            <span className="font-mono font-bold text-zinc-900 block text-sm">
              {godownWeight.toFixed(3)} MT
            </span>
            <span className="text-[10px] text-zinc-400 block">Yard stock depleted</span>
          </div>

          {/* Outward Dispatch Details */}
          <div className="p-2.5 rounded-lg bg-white border border-zinc-200/70 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-[11px]">
              <ArrowUp className="h-3.5 w-3.5" />
              <span>Outward Dispatched</span>
            </div>
            <span className="font-mono font-bold text-zinc-900 block text-sm">
              {outwardWeight.toFixed(3)} MT
            </span>
            {lorryOut && (
              <span className="text-[10px] text-zinc-400 block font-mono truncate">
                Lorry: {lorryOut}
              </span>
            )}
          </div>
        </div>

        {/* Quality & Gate Reconciliation Status */}
        <div className="flex items-center justify-between border-t border-zinc-200/80 pt-3">
          <div className="flex items-center gap-1.5 text-zinc-700 font-medium truncate">
            <Scale className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>Total Load: <strong className="font-mono text-zinc-900">{totalWeight.toFixed(3)} MT</strong></span>
            {qualityName && <span className="text-zinc-400">({qualityName})</span>}
          </div>

          <span
            className={cn(
              'font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border shadow-2xs',
              isReconciled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isUnderDispatched
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : isOverload
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-zinc-100 text-zinc-700 border-zinc-200'
            )}
          >
            {isReconciled
              ? 'Reconciled (0.000 MT)'
              : variance > 0
              ? `Overload (+${variance.toFixed(3)} MT)`
              : `Variance (${variance.toFixed(3)} MT)`}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to="/inventory/list"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs"
        >
          <List className="h-4 w-4 text-zinc-500" />
          <span>View All Transactions</span>
        </Link>

        <button
          type="button"
          onClick={onAddAnother}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-600/25 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Another Transaction</span>
        </button>
      </div>
    </div>
  )
}

export default SuccessCard
