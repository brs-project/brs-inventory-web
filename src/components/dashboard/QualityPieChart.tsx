import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { formatWeight } from '@lib/utils'

interface QualityItem {
  name: string
  value: number
  color: string
}

interface QualityPieChartProps {
  data: QualityItem[]
  isLoading?: boolean
}

export function QualityPieChart({ data, isLoading }: QualityPieChartProps) {
  const totalWeight = data.reduce((acc, curr) => acc + curr.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as QualityItem
      const percentage = totalWeight > 0 ? ((item.value / totalWeight) * 100).toFixed(1) : '0.0'
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
          </div>
          <p className="text-slate-300 font-mono">
            Stock: <span className="font-bold text-white">{formatWeight(item.value)}</span>
          </p>
          <p className="text-blue-400 font-semibold text-[11px]">{percentage}% of total stock</p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm animate-pulse space-y-4">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between select-none">
      <div className="mb-2">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Quality-wise Stock Distribution
        </h2>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Current stock breakdown by grade
        </p>
      </div>

      {/* Donut Chart Container with Center Text Overlay */}
      <div className="relative w-full h-[210px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total MT Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Stock
          </span>
          <span className="text-sm font-extrabold text-slate-900 font-mono">
            {formatWeight(totalWeight)}
          </span>
        </div>
      </div>

      {/* Custom Legend Below Chart */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {data.map((item) => {
          const percent = totalWeight > 0 ? ((item.value / totalWeight) * 100).toFixed(0) : '0'
          return (
            <div key={item.name} className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <div className="truncate text-left leading-tight">
                <span className="font-semibold text-slate-700 block truncate">{item.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {item.value} MT ({percent}%)
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default QualityPieChart
