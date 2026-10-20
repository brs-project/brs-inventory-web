export interface PreviewWeightBarsProps {
  inwardWeight: number
  godownWeight: number
  outwardWeight: number
}

export function PreviewWeightBars({
  inwardWeight = 0,
  godownWeight = 0,
  outwardWeight = 0,
}: PreviewWeightBarsProps) {
  const maxWeight = Math.max(inwardWeight + godownWeight, outwardWeight, 0.001)

  const inwardPct = Math.min(100, Math.round((inwardWeight / maxWeight) * 100))
  const godownPct = Math.min(100, Math.round((godownWeight / maxWeight) * 100))
  const outwardPct = Math.min(100, Math.round((outwardWeight / maxWeight) * 100))

  return (
    <div className="space-y-2.5 pt-1">
      {/* Inward Weight Row */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 flex items-center gap-1">
            <span className="text-blue-500 font-bold">↓</span> Inward Consignment
          </span>
          <span className="font-mono font-semibold text-zinc-800">
            {inwardWeight.toFixed(3)} MT
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${inwardWeight > 0 ? inwardPct : 0}%` }}
          />
        </div>
      </div>

      {/* Godown Weight Row */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 flex items-center gap-1">
            <span className="text-emerald-500 font-bold">+</span> Loaded from Godown
          </span>
          <span className="font-mono font-semibold text-zinc-800">
            {godownWeight.toFixed(3)} MT
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${godownWeight > 0 ? godownPct : 0}%` }}
          />
        </div>
      </div>

      {/* Outward Weight Row */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600 flex items-center gap-1">
            <span className="text-amber-500 font-bold">↑</span> Outward Dispatched
          </span>
          <span className="font-mono font-semibold text-zinc-800">
            {outwardWeight.toFixed(3)} MT
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${outwardWeight > 0 ? outwardPct : 0}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default PreviewWeightBars
