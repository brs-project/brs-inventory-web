import { useMemo } from 'react'
import { format } from 'date-fns'
import {
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Check,
} from 'lucide-react'
import { cn } from '@lib/utils'
import type { Party, Quality } from '@types'

export interface DispatchPreviewData {
  dispatch_date: string
  status: 'dispatched' | 'draft' | 'cancelled'
  dispatch_bill_number: string
  quality_id: string
  lorry_number: string
  bill_weight: number | ''
  party_id: string
  bill_number?: string
  transporter: string
  remarks?: string
}

export interface DispatchPreviewPanelProps {
  data: DispatchPreviewData
  qualities: Quality[]
  parties: Party[]
  className?: string
}

export function DispatchPreviewPanel({
  data,
  qualities,
  parties,
  className,
}: DispatchPreviewPanelProps) {
  const selectedQuality = useMemo(
    () => (qualities || []).find((q) => q && q.id === data?.quality_id),
    [qualities, data?.quality_id]
  )

  const selectedParty = useMemo(
    () => (parties || []).find((p) => p && p.id === data?.party_id),
    [parties, data?.party_id]
  )

  const dateDisplay = useMemo(() => {
    try {
      if (!data.dispatch_date) return '—'
      const d = new Date(data.dispatch_date)
      return isNaN(d.getTime()) ? data.dispatch_date : format(d, 'dd MMM yyyy')
    } catch {
      return data.dispatch_date || '—'
    }
  }, [data.dispatch_date])

  const weightNum = typeof data.bill_weight === 'number' ? data.bill_weight : 0
  const weightKg = Math.round(weightNum * 1000)

  // Calculate completion percentage based on 7 required fields
  const completionStats = useMemo(() => {
    let filled = 0
    if (data.dispatch_date) filled++
    if (data.quality_id) filled++
    if (data.lorry_number) filled++
    if (typeof data.bill_weight === 'number' && data.bill_weight > 0) filled++
    if (data.party_id) filled++
    if (data.transporter) filled++
    if (data.dispatch_bill_number) filled++

    const total = 7
    const percent = Math.round((filled / total) * 100)
    const isComplete = filled === total

    return { filled, total, percent, isComplete }
  }, [data])

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden select-none',
        className
      )}
    >
      {/* Top Header Strip */}
      <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-white/80" />
          <h3 className="text-sm font-semibold tracking-wide">Dispatch Preview</h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-indigo-100 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 text-xs divide-y divide-slate-100">
        {/* Section 1: Dispatch Details */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            DISPATCH DETAILS
          </span>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-medium">Date:</span>
            <span className="font-semibold text-slate-800 text-right">{dateDisplay}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-medium">Status:</span>
            {data.status === 'dispatched' && (
              <span className="inline-flex items-center gap-1 text-green-700 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                <span>Dispatched</span>
              </span>
            )}
            {data.status === 'draft' && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Draft</span>
              </span>
            )}
            {data.status === 'cancelled' && (
              <span className="inline-flex items-center gap-1 text-red-700 font-bold">
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <span>Cancelled</span>
              </span>
            )}
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-medium">Dispatch Bill:</span>
            <span className="font-mono font-bold text-indigo-950 text-right">
              {data.dispatch_bill_number || <span className="text-slate-300 font-normal italic">—</span>}
            </span>
          </div>
        </div>

        {/* Section 2: Prominent Weight Display */}
        <div className="pt-3">
          <div className="bg-indigo-50/70 rounded-lg p-3.5 text-center border border-indigo-100 space-y-0.5">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
              BILL WEIGHT
            </span>
            <p
              className={cn(
                'text-2xl sm:text-3xl font-mono font-bold tracking-tight transition-colors duration-200',
                weightNum > 0 ? 'text-indigo-600' : 'text-slate-300'
              )}
            >
              {weightNum.toFixed(3)}{' '}
              <span className="text-xs font-semibold uppercase text-indigo-400">MT</span>
            </p>
            <p className="text-xs text-indigo-500 font-mono font-medium">
              = {weightKg.toLocaleString()} KG
            </p>
          </div>
        </div>

        {/* Section 3: Material & Vehicle */}
        <div className="pt-3 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            MATERIAL &amp; VEHICLE
          </span>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-medium">Quality:</span>
            <div className="text-right flex items-center justify-end gap-1.5">
              {selectedQuality ? (
                <>
                  <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                    {selectedQuality.quality_name}
                  </span>
                  {selectedQuality.category && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                      {selectedQuality.category}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-300 italic">—</span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-medium">Lorry No:</span>
            {data.lorry_number ? (
              <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {data.lorry_number}
              </span>
            ) : (
              <span className="text-slate-300 italic">—</span>
            )}
          </div>
        </div>

        {/* Section 4: Party & Transport */}
        <div className="pt-3 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            PARTY &amp; TRANSPORT
          </span>

          <div className="flex justify-between items-start py-1">
            <span className="text-slate-400 font-medium shrink-0 w-20">Party:</span>
            <div className="text-right flex-1 min-w-0">
              {selectedParty ? (
                <>
                  <span className="font-semibold text-slate-800 block truncate">
                    {selectedParty.party_name}
                  </span>
                  {selectedParty.party_code && (
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {selectedParty.party_code}
                      {selectedParty.city ? ` • ${selectedParty.city}` : ''}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-300 italic">—</span>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-medium shrink-0 w-24">Transporter:</span>
            <span className="font-medium text-slate-800 text-right truncate flex-1">
              {data.transporter || <span className="text-slate-300 italic font-normal">—</span>}
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400 font-medium shrink-0 w-20">Bill No:</span>
            <span className="font-mono text-slate-600 text-right truncate flex-1">
              {data.bill_number || <span className="text-slate-300 italic font-normal">—</span>}
            </span>
          </div>
        </div>

        {/* Section 5: Form Completion Progress Bar */}
        <div className="pt-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-semibold">Form Completion</span>
            <span
              className={cn(
                'font-mono text-[11px] font-bold',
                completionStats.isComplete ? 'text-green-600' : 'text-slate-500'
              )}
            >
              {completionStats.filled} / {completionStats.total} fields
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300 ease-out',
                completionStats.isComplete ? 'bg-emerald-500' : 'bg-indigo-500'
              )}
              style={{ width: `${completionStats.percent}%` }}
            />
          </div>

          {completionStats.isComplete ? (
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 pt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> All required fields complete
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 pt-0.5">
              Fill all mandatory fields to save dispatch.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default DispatchPreviewPanel
