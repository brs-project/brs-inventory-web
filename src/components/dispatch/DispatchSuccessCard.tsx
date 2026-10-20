import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CheckCircle2,
  Plus,
  List,
  Send,
  Truck,
  Scale,
  Building2,
  FileText,
  Tag,
} from 'lucide-react'
import type { DispatchEntry } from '@types'

export interface DispatchSuccessCardProps {
  entry: DispatchEntry
  onAddAnother: () => void
}

export function DispatchSuccessCard({ entry, onAddAnother }: DispatchSuccessCardProps) {
  const navigate = useNavigate()

  const formattedDate = (() => {
    try {
      const d = new Date(entry.dispatch_date)
      return isNaN(d.getTime()) ? entry.dispatch_date : format(d, 'EEEE, dd MMMM yyyy')
    } catch {
      return entry.dispatch_date
    }
  })()

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 max-w-2xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-300 select-none">
      {/* Animated / styled Success Icon */}
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
        <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Dispatch Saved Successfully!
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          The outward consignment was recorded and added to the dispatch register.
        </p>
      </div>

      {/* Detail Breakdown Card */}
      <div className="bg-slate-50 rounded-xl border border-slate-200/90 p-5 text-left text-xs space-y-3">
        {/* Top bar inside card: Bill No + Date + Status */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600" />
            <span className="font-mono font-bold text-base text-indigo-950">
              {entry.dispatch_bill_number}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 font-medium">{formattedDate}</span>
            <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
              ✓ {entry.status}
            </span>
          </div>
        </div>

        {/* Info Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 pt-1">
          {/* Quality */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Quality:
            </span>
            <span className="font-semibold text-slate-800">
              {entry.qualities?.quality_name || entry.quality_id}
            </span>
          </div>

          {/* Party */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Party:
            </span>
            <span className="font-semibold text-slate-800 truncate max-w-[170px]">
              {entry.parties?.party_name || entry.party_id}
            </span>
          </div>

          {/* Lorry */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              Lorry No:
            </span>
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-800">
              {entry.lorry_number}
            </span>
          </div>

          {/* Transporter */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Transporter:
            </span>
            <span className="font-medium text-slate-800 truncate max-w-[170px]">
              {entry.transporter}
            </span>
          </div>

          {/* Bill Wt */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100 sm:border-none">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Scale className="w-3.5 h-3.5 text-slate-400" />
              Bill Wt:
            </span>
            <span className="font-mono font-bold text-sm text-indigo-700">
              {entry.bill_weight.toFixed(3)} MT
            </span>
          </div>

          {/* Internal Bill No */}
          <div className="flex items-center justify-between py-1 sm:border-none">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Bill No (Ref):
            </span>
            <span className="font-mono text-slate-700">
              {entry.bill_number || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate('/dispatch/list')}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
        >
          <List className="w-4 h-4 text-slate-500" />
          <span>View Dispatch Sheet</span>
        </button>

        <button
          type="button"
          onClick={onAddAnother}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Dispatch</span>
        </button>
      </div>
    </div>
  )
}

export default DispatchSuccessCard
