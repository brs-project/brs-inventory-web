import { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@lib/billCalculations'
import { cn } from '@lib/utils'
import type { BillEntry } from '@types'

export interface MarkAsPaidModalProps {
  open: boolean
  onClose: () => void
  entry?: BillEntry | null
  bulkEntries?: BillEntry[]
  onConfirm: (data: {
    rtgsReference: string
    paymentStatus: 'paid' | 'partial'
    amountPaid?: number
    paymentDate: string
    remarks?: string
    entryIds: string[]
  }) => Promise<void>
}

export function MarkAsPaidModal({
  open,
  onClose,
  entry,
  bulkEntries = [],
  onConfirm,
}: MarkAsPaidModalProps) {
  const isBulk = bulkEntries.length > 0
  const targets = isBulk ? bulkEntries : entry ? [entry] : []
  const totalAmount = targets.reduce((sum, t) => sum + (t.rtgs_amount || 0), 0)

  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial'>('paid')
  const [rtgsReference, setRtgsReference] = useState('')
  const [amountPaid, setAmountPaid] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
  const [remarks, setRemarks] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPaymentStatus('paid')
      setRtgsReference('')
      setAmountPaid('')
      setPaymentDate(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }))
      setRemarks('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [open])

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || targets.length === 0) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!rtgsReference.trim()) {
      setError('RTGS Reference / UTR Number is required')
      return
    }

    if (paymentStatus === 'partial') {
      const parsed = parseFloat(amountPaid)
      if (isNaN(parsed) || parsed <= 0) {
        setError('Please enter a valid partial payment amount')
        return
      }
      if (parsed > totalAmount) {
        setError(`Partial payment cannot exceed ${formatCurrency(totalAmount)}`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      await onConfirm({
        rtgsReference: rtgsReference.trim(),
        paymentStatus,
        amountPaid:
          paymentStatus === 'partial' && amountPaid
            ? parseFloat(amountPaid)
            : undefined,
        paymentDate,
        remarks: remarks.trim() || undefined,
        entryIds: targets.map((t) => t.id),
      })
      onClose()
    } catch {
      setError('Failed to record payment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const firstTarget = targets[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[384px] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50 animate-in zoom-in-95 duration-150">
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">
              {isBulk ? `Record Payment (${targets.length})` : 'Mark as Paid'}
            </h2>
            <div className="text-xs text-gray-500 mt-0.5">
              {isBulk ? (
                `${targets.length} bills selected`
              ) : (
                <span>
                  <span className="font-mono font-semibold text-gray-800">
                    {firstTarget.party_code}
                  </span>{' '}
                  · {firstTarget.parties?.party_name || 'Supplier'}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* OUTSTANDING AMOUNT HERO STRIP */}
        <div className="px-5 py-3 bg-orange-50/70 border-b border-orange-100 flex items-center justify-between">
          <span className="text-xs font-medium text-orange-700">Outstanding</span>
          <span className="text-base font-bold font-mono text-orange-600">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* RTGS Reference */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              RTGS Reference / UTR <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. RTGS20260916001"
              value={rtgsReference}
              onChange={(e) => setRtgsReference(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-mono font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
              autoFocus
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
            />
          </div>

          {/* Payment Status Segmented / Radio */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Settlement Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={cn(
                  'h-8 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
                  paymentStatus === 'paid'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                <span>Fully Settled</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('partial')}
                className={cn(
                  'h-8 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
                  paymentStatus === 'partial'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                <span>Partial Paid</span>
              </button>
            </div>
          </div>

          {/* Amount Paid (if partial) */}
          {paymentStatus === 'partial' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Installment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={totalAmount}
                  placeholder="e.g. 2500"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full h-9 pl-7 pr-3 rounded-lg border border-gray-200 bg-white text-xs font-mono font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
                />
              </div>
            </div>
          )}

          {/* Remarks (optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Remarks (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. HDFC Net Banking"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 px-3 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
