import { formatISTDate, formatISTDateTime } from '@lib/dateUtils'
import { useEffect } from 'react'
import { format } from 'date-fns'
import {
  ArrowLeft,
  X,
  Edit2,
  Printer,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Trash2,
  Building2,
  Truck,
  FileText,
  Clock,
} from 'lucide-react'
import {
  formatCurrency,
  formatRate,
  formatMT,
  formatKG,
} from '@lib/billCalculations'
import { cn } from '@lib/utils'
import type { BillEntry } from '@types'

export interface BillDetailDrawerProps {
  open: boolean
  onClose: () => void
  entry?: BillEntry | null
  onEdit?: (entry: BillEntry) => void
  onMarkAsPaid?: (entry: BillEntry) => void
  onDelete?: (entry: BillEntry) => void
}

export function BillDetailDrawer({
  open,
  onClose,
  entry,
  onEdit,
  onMarkAsPaid,
  onDelete,
}: BillDetailDrawerProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !entry) return null

  const isUnder = entry.billing_type === 'under'
  const isOver = entry.billing_type === 'over'
  const isExact = entry.billing_type === 'exact'

  const canPay =
    (entry.payment_status === 'pending' || entry.payment_status === 'partial') &&
    !isExact

  const handlePrint = () => {
    window.print()
  }

  // Category badge color helper
  const getQualityBadgeColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'scrap':
        return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'heavy':
        return 'bg-amber-50 text-amber-600 border-amber-100'
      case 'processed':
        return 'bg-purple-50 text-purple-600 border-purple-100'
      case 'primary':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop with fade */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Right Panel */}
      <div className="relative w-full max-w-[420px] bg-white h-full z-50 shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* TOP BAR */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors p-1 -ml-1 rounded-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrint}
              title="Print transaction details"
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEdit(entry)
                }}
                title="Edit entry"
                className="h-7 px-2.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3 h-3 text-gray-400" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* HEADER: DATE & PARTY */}
          <div>
            <div className="text-xs font-medium text-gray-400">
              {format(new Date(entry.bill_date), 'EEEE')}
            </div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight mt-0.5">
              {formatISTDate(entry.bill_date)}
            </h2>

            <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
              <span className="font-mono font-semibold text-gray-900">
                {entry.party_code}
              </span>
              <span className="text-gray-300">·</span>
              <span className="font-medium">{entry.parties?.party_name || '—'}</span>
            </div>
            {entry.parties?.city && (
              <div className="text-xs text-gray-400 mt-0.5">
                {entry.parties.city}
                {entry.parties.state ? `, ${entry.parties.state}` : ''}
              </div>
            )}

            {/* STATUS PILLS */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {/* Billing Type Pill */}
              {isUnder && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 border border-orange-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  Under Billing
                </span>
              )}
              {isOver && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Over Billing
                </span>
              )}
              {isExact && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Exact Match
                </span>
              )}

              {/* Payment Status Pill */}
              {entry.payment_status === 'paid' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle className="w-3 h-3" />
                  Paid
                </span>
              ) : entry.payment_status === 'partial' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600 border border-violet-200">
                  <Clock className="w-3 h-3" />
                  Partial
                </span>
              ) : isExact ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 border border-gray-200">
                  N/A
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Pending
                </span>
              )}
            </div>
          </div>

          {/* RATE ANALYSIS */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Rate Analysis
            </div>

            <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Bill Rate</span>
                <span className="font-mono font-medium text-gray-700">
                  {formatRate(entry.bill_rate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Actual Rate</span>
                <span className="font-mono font-medium text-gray-700">
                  {formatRate(entry.actual_rate)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center">
                <span className="font-medium text-gray-900">Difference</span>
                <span
                  className={cn(
                    'font-mono font-semibold flex items-center gap-1',
                    isUnder && 'text-orange-600',
                    isOver && 'text-red-500',
                    isExact && 'text-emerald-600'
                  )}
                >
                  {entry.rate_difference > 0 ? '+' : ''}
                  ₹{Math.abs(entry.rate_difference).toFixed(2)}/kg
                  {isUnder && <TrendingUp className="w-3.5 h-3.5" />}
                  {isOver && <TrendingDown className="w-3.5 h-3.5" />}
                  {isExact && <CheckCircle className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>
          </div>

          {/* QUANTITY */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Quantity
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-gray-900 tabular-nums">
                {formatMT(entry.quantity_mt)}
              </span>
              <span className="text-xs font-mono text-gray-400">
                = {formatKG(entry.quantity_kg)}
              </span>
            </div>
          </div>

          {/* RTGS AMOUNT HERO BOX */}
          <div
            className={cn(
              'rounded-xl p-4 text-center border transition-all',
              isUnder &&
                'bg-orange-50/80 border-orange-200/80 text-orange-950',
              isOver &&
                'bg-red-50/80 border-red-200/80 text-red-950',
              isExact &&
                'bg-emerald-50/80 border-emerald-200/80 text-emerald-950'
            )}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
              {isUnder && 'RTGS Payment Amount'}
              {isOver && 'Refund / Debit Adjustment'}
              {isExact && 'Consignment Balanced'}
            </div>

            <div
              className={cn(
                'text-3xl font-bold font-mono tracking-tight my-1',
                isUnder && 'text-orange-600',
                isOver && 'text-red-600',
                isExact && 'text-emerald-600'
              )}
            >
              {formatCurrency(Math.abs(entry.rtgs_amount))}
            </div>

            <div className="text-[11px] font-mono opacity-60">
              ₹{Math.abs(entry.rate_difference).toFixed(2)} × {entry.quantity_kg.toLocaleString('en-IN')} KG
            </div>
          </div>

          {/* DETAILS LIST */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Details
            </div>

            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white overflow-hidden text-xs">
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-300" />
                  Quality
                </span>
                <div className="flex items-center gap-1.5 font-medium text-gray-800">
                  <span>{entry.qualities?.quality_name || '—'}</span>
                  {entry.qualities?.category && (
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full border font-normal',
                        getQualityBadgeColor(entry.qualities.category)
                      )}
                    >
                      {entry.qualities.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-gray-300" />
                  Lorry No
                </span>
                <span className="font-mono text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">
                  {entry.lorry_number}
                </span>
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-300" />
                  Bill No / Invoice
                </span>
                <span className="font-mono font-medium text-gray-800">
                  {entry.bill_number || '—'}
                </span>
              </div>

              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-gray-300" />
                  RTGS Ref
                </span>
                <span className="font-mono text-xs text-gray-700">
                  {entry.rtgs_reference ? (
                    <span className="font-semibold text-gray-900">
                      {entry.rtgs_reference}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Pending</span>
                  )}
                </span>
              </div>

              {entry.remarks && (
                <div className="px-3.5 py-2.5 flex flex-col gap-1">
                  <span className="text-gray-400">Remarks</span>
                  <span className="text-gray-700">{entry.remarks}</span>
                </div>
              )}
            </div>
          </div>

          {/* AUDIT META */}
          <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span>ID: {entry.id.slice(0, 8)}</span>
            <span>Recorded: {formatISTDateTime(entry.created_at)}</span>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex items-center justify-between gap-3">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                onDelete(entry)
              }}
              className="h-8 px-3 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {canPay && onMarkAsPaid && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onMarkAsPaid(entry)
                }}
                className="h-8 px-4 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Mark as Paid</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
