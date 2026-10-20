import { useMemo } from 'react'
import { format } from 'date-fns'
import { ClipboardList, ChevronDown, ChevronUp, Scale } from 'lucide-react'
import { cn } from '@lib/utils'
import { PreviewWeightBars } from './PreviewWeightBars'
import { FormCompletion } from './FormCompletion'
import type { Party, Quality, Godown } from '@types'

export interface TransactionPreviewProps {
  date?: Date
  billNumber?: string
  status?: 'completed' | 'draft'
  partyId?: string
  qualityId?: string
  godownId?: string
  vehicleInId?: string
  vehicleOutId?: string
  inwardWeight?: number
  godownWeight?: number
  outwardWeight?: number
  totalWeight?: number
  dispatchVariance?: number
  variance?: number
  netStock?: number
  parties: Party[]
  qualities: Quality[]
  godowns: Godown[]
  isMobileOpen?: boolean
  onToggleMobile?: () => void
}

export function TransactionPreview({
  date,
  billNumber,
  status = 'completed',
  partyId,
  qualityId,
  godownId,
  vehicleInId,
  vehicleOutId,
  inwardWeight = 0,
  godownWeight = 0,
  outwardWeight = 0,
  totalWeight: propTotalWeight,
  dispatchVariance: propDispatchVariance,
  parties,
  qualities,
  godowns,
  isMobileOpen = false,
  onToggleMobile,
}: TransactionPreviewProps) {
  const selectedParty = useMemo(() => {
    return parties.find((p) => p.id === partyId)
  }, [parties, partyId])

  const selectedQuality = useMemo(() => {
    return qualities.find((q) => q.id === qualityId)
  }, [qualities, qualityId])

  const selectedGodown = useMemo(() => {
    return godowns.find((g) => g.id === godownId)
  }, [godowns, godownId])

  // Count filled required / core fields for progress calculation
  const completedFieldsCount = useMemo(() => {
    let count = 0
    if (date) count++
    if (partyId) count++
    if (qualityId) count++
    if (inwardWeight > 0 || godownWeight > 0 || outwardWeight > 0) count++
    if (vehicleInId || vehicleOutId) count++
    return count
  }, [date, partyId, qualityId, inwardWeight, godownWeight, outwardWeight, vehicleInId, vehicleOutId])

  const inwardNum = Number(inwardWeight) || 0
  const godownNum = Number(godownWeight) || 0
  const outwardNum = Number(outwardWeight) || 0

  const totalVehicleLoad =
    propTotalWeight !== undefined
      ? propTotalWeight
      : Math.round((inwardNum + godownNum) * 1000) / 1000

  const dispatchDiff =
    propDispatchVariance !== undefined
      ? propDispatchVariance
      : Math.round((outwardNum - totalVehicleLoad) * 1000) / 1000

  const isReconciled = totalVehicleLoad > 0 && outwardNum > 0 && dispatchDiff === 0
  const isUnderDispatched = totalVehicleLoad > 0 && outwardNum > 0 && dispatchDiff < 0
  const isOverload = totalVehicleLoad > 0 && outwardNum > 0 && dispatchDiff > 0

  return (
    <div className="bg-white rounded-xl border border-zinc-200/90 shadow-xs overflow-hidden select-none">
      {/* Panel Header */}
      <div
        onClick={onToggleMobile}
        className="bg-zinc-50/90 border-b border-zinc-200 px-4 sm:px-5 py-3.5 flex items-center justify-between cursor-pointer lg:cursor-default"
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-zinc-500" />
          <h3 className="text-sm font-semibold text-zinc-800 tracking-tight">
            Transaction Preview
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>

          {/* Mobile Accordion Toggle Icon */}
          <button
            type="button"
            className="lg:hidden p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            aria-label="Toggle preview"
          >
            {isMobileOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Body: Collapsible on mobile, always open on lg */}
      <div className={cn('p-4 sm:p-5 space-y-4', !isMobileOpen && 'hidden lg:block')}>
        {/* Basic Details */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            CONSIGNMENT METADATA
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-zinc-500">Date:</span>
              <span className="font-medium text-zinc-800">
                {date ? format(date, 'dd MMM yyyy') : <span className="text-zinc-300 italic">—</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-zinc-500">Party:</span>
              <span className="font-medium text-zinc-800 text-right truncate max-w-[190px]">
                {selectedParty ? (
                  `${selectedParty.party_name} (${selectedParty.party_code})`
                ) : (
                  <span className="text-zinc-300 italic">— (not selected)</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-zinc-500">Quality:</span>
              <span className="font-medium text-zinc-800 text-right truncate max-w-[190px]">
                {selectedQuality ? (
                  `${selectedQuality.quality_name}`
                ) : (
                  <span className="text-zinc-300 italic">— (not selected)</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-zinc-500">Bill No:</span>
              <span className="font-mono font-medium text-zinc-800">
                {billNumber || <span className="text-zinc-300 italic">—</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-zinc-500">Status:</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded text-[11px]',
                  status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                />
                {status === 'completed' ? 'Completed' : 'Draft'}
              </span>
            </div>
          </div>
        </div>

        <hr className="border-zinc-100" />

        {/* Live Calculation Desk Breakdown */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
            <Scale className="h-3.5 w-3.5 text-indigo-600" />
            <span>CALCULATION BREAKDOWN</span>
          </h4>

          <div className="bg-zinc-50/90 rounded-xl p-3 border border-zinc-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between py-0.5 text-zinc-600">
              <span className="flex items-center gap-1">
                <span className="text-blue-600 font-bold">+</span> Inward Weight:
              </span>
              <span className="font-mono font-semibold text-zinc-800">
                {inwardNum.toFixed(3)} MT
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5 text-zinc-600">
              <span className="flex items-center gap-1">
                <span className="text-emerald-600 font-bold">+</span> Loaded from Godown:
              </span>
              <span className="font-mono font-semibold text-zinc-800">
                {godownNum.toFixed(3)} MT
              </span>
            </div>

            <div className="border-t border-zinc-200/80 pt-2 flex items-center justify-between font-bold text-zinc-900">
              <span className="flex items-center gap-1">
                <span className="text-indigo-600">=</span> Total Vehicle Load:
              </span>
              <span className="font-mono text-sm text-indigo-700">
                {totalVehicleLoad.toFixed(3)} MT
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5 text-zinc-600 border-t border-dashed border-zinc-200/80 pt-1.5">
              <span className="flex items-center gap-1">
                <span className="text-amber-600 font-bold">&minus;</span> Outward Dispatch:
              </span>
              <span className="font-mono font-semibold text-zinc-800">
                {outwardNum.toFixed(3)} MT
              </span>
            </div>

            {/* Reconciliation Variance Row */}
            <div className="border-t border-zinc-200 pt-2 flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Gate Discrepancy:</span>
              <span
                className={cn(
                  'font-mono font-bold text-xs px-2 py-0.5 rounded-md border shadow-2xs',
                  isReconciled
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : isUnderDispatched
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : isOverload
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                )}
              >
                {dispatchDiff > 0 ? `+${dispatchDiff.toFixed(3)}` : dispatchDiff.toFixed(3)} MT
              </span>
            </div>
          </div>
        </div>

        <hr className="border-zinc-100" />

        {/* Visual Weight Distribution Bars */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
            WEIGHT DISTRIBUTION
          </h4>
          <PreviewWeightBars
            inwardWeight={inwardNum}
            godownWeight={godownNum}
            outwardWeight={outwardNum}
          />
        </div>

        <hr className="border-zinc-100" />

        {/* Transport & Location */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
            TRANSPORT &amp; LOCATION
          </h4>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between py-0.5">
              <span className="text-zinc-500">In Lorry:</span>
              <span className="font-mono font-medium text-zinc-800 truncate max-w-[190px]">
                {vehicleInId || <span className="text-zinc-300 italic">—</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-zinc-500">Out Lorry:</span>
              <span className="font-mono font-medium text-zinc-800 truncate max-w-[190px]">
                {vehicleOutId || <span className="text-zinc-300 italic">—</span>}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-zinc-500">Storage Yard:</span>
              <span className="font-medium text-zinc-800 truncate max-w-[190px]">
                {selectedGodown ? (
                  selectedGodown.godown_name
                ) : (
                  <span className="text-zinc-300 italic">—</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <hr className="border-zinc-100" />

        {/* Form Completion Progress */}
        <FormCompletion completedFields={completedFieldsCount} totalFields={5} />
      </div>
    </div>
  )
}

export default TransactionPreview
