import { formatISTDate, formatISTDateTime } from '@lib/dateUtils'
import { Link } from 'react-router-dom'
import {
  X,
  Printer,
  Pencil,
  Calendar,
  Tag,
  Truck,
  Scale,
  User,
  Clock,
} from 'lucide-react'
import type { DispatchEntry } from '@types'

export interface DispatchDetailModalProps {
  open: boolean
  onClose: () => void
  dispatch: DispatchEntry | null
}

export function DispatchDetailModal({
  open,
  onClose,
  dispatch,
}: DispatchDetailModalProps) {
  if (!open || !dispatch) return null

  const handlePrint = () => {
    window.print()
  }

  const formattedDate = formatISTDate(dispatch.dispatch_date)
  const formattedCreated = formatISTDateTime(dispatch.created_at)
  const formattedUpdated = formatISTDateTime(dispatch.updated_at)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none print:p-0 print:static">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150 print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] z-50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150 print:max-w-full print:shadow-none print:border-none print:max-h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                {dispatch.dispatch_bill_number}
              </span>

              {dispatch.status === 'dispatched' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  <span>Dispatched</span>
                </span>
              ) : dispatch.status === 'draft' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>Draft</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  <span>Cancelled</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Outward Date: {formattedDate}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-slate-200/60 transition cursor-pointer print:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-zinc-800 scrollbar-thin">
          {/* Top Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. CONSIGNMENT & BUYER */}
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                <span>Consignment &amp; Buyer</span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Material Grade
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-zinc-900">
                      {dispatch.qualities?.quality_name || dispatch.quality_id}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold uppercase bg-slate-200/80 text-zinc-700 border border-slate-300/80">
                      {dispatch.qualities?.category || 'Scrap'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Party / Customer Name
                  </span>
                  <p className="text-sm font-bold text-zinc-900 mt-0.5">
                    {dispatch.parties?.party_name || dispatch.party_id}
                  </p>
                  {(dispatch.parties?.party_code || dispatch.parties?.city) && (
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">
                      Code: {dispatch.parties?.party_code}
                      {dispatch.parties?.city ? ` • City: ${dispatch.parties.city}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. WEIGHT & INVOICE */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7]/50 border border-[#BBF7D0] space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-900/80">
                <Scale className="h-3.5 w-3.5 text-emerald-700" />
                <span>Billed Outward Weight</span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-bold font-mono text-emerald-950 tracking-tight">
                      {dispatch.bill_weight.toFixed(3)}
                    </span>
                    <span className="text-sm font-semibold text-emerald-800 font-mono">MT</span>
                  </div>
                  <span className="text-[11px] text-emerald-900/70 font-mono block mt-0.5">
                    = {(dispatch.bill_weight * 1000).toLocaleString('en-IN')} KG
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-900/70 uppercase block">
                      Purchase Bill #
                    </span>
                    <span className="font-mono font-semibold text-emerald-950">
                      {dispatch.bill_number || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-emerald-900/70 uppercase block">
                      Dispatch Bill #
                    </span>
                    <span className="font-mono font-bold text-emerald-950">
                      {dispatch.dispatch_bill_number}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. TRANSPORT DETAILS */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Truck className="h-3.5 w-3.5 text-slate-500" />
              <span>Fleet &amp; Carrier Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Lorry Registration Plate
                </span>
                <span className="font-mono text-sm font-bold text-zinc-900 bg-white border border-[#E5E7EB] px-2 py-0.5 rounded inline-block mt-1">
                  {dispatch.lorry_number}
                </span>
                {dispatch.vehicles?.owner_name && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Owner: {dispatch.vehicles.owner_name}
                    {dispatch.vehicles.capacity_mt ? ` • ${dispatch.vehicles.capacity_mt} MT Capacity` : ''}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Logistics Carrier
                </span>
                <span className="italic font-medium text-zinc-900 block mt-1">
                  {dispatch.transporter}
                </span>
              </div>
            </div>
          </div>

          {/* 4. REMARKS */}
          <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E5E7EB] space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Gate Notes &amp; Remarks
            </span>
            <p className="text-xs text-zinc-700 leading-relaxed">
              {dispatch.remarks ? dispatch.remarks : <span className="italic text-slate-400">(no remarks recorded)</span>}
            </p>
          </div>

          {/* 5. AUDIT TIMESTAMPS */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Created by: <strong className="text-zinc-700">{dispatch.created_by}</strong> ({formattedCreated})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated: {formattedUpdated}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between gap-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-100 text-zinc-700 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <Link
              to={`/dispatch/edit/${dispatch.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <Pencil className="h-3.5 w-3.5 text-amber-700" />
              <span>Edit Dispatch</span>
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Waybill Chit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DispatchDetailModal
