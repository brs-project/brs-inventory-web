export interface QuantitySectionProps {
  quantityMt: number | ''
}

export function QuantitySection({ quantityMt }: QuantitySectionProps) {
  const qty = typeof quantityMt === 'number' ? quantityMt : 0
  const qtyKg = Math.round(qty * 1000)
  const percentOf30MT = Math.min(Math.round((qty / 30) * 100), 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Consignment Weight
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          {qty > 0 ? `${percentOf30MT}% load` : '0%'}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-black font-mono text-slate-900">
            {qty > 0 ? `${qty.toFixed(3)} MT` : '0.000 MT'}
          </span>
          <span className="text-xs font-mono font-medium text-slate-500">
            = {qtyKg.toLocaleString()} KG
          </span>
        </div>
      </div>

      {/* Visual Capacity Bar */}
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentOf30MT}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 MT</span>
          <span>Max 30 MT standard vehicle capacity</span>
        </div>
      </div>
    </div>
  )
}

export default QuantitySection
