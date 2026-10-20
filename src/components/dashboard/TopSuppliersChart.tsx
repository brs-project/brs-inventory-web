import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from 'recharts'
import { formatWeight } from '@lib/utils'

interface SupplierItem {
  name: string
  volume: number
}

interface TopSuppliersChartProps {
  data: SupplierItem[]
  isLoading?: boolean
}

export function TopSuppliersChart({ data, isLoading }: TopSuppliersChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as SupplierItem
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
          <p className="font-bold text-slate-200">{item.name}</p>
          <p className="text-blue-400 font-mono">
            Total Supply: <span className="font-bold text-white">{formatWeight(item.volume)}</span>
          </p>
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
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Top 5 Suppliers by Volume
        </h2>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          This month's highest delivery volumes (MT)
        </p>
      </div>

      <div className="w-full h-[220px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 45, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="supplierGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tickFormatter={(v) => `${v} MT`}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              width={85}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="volume"
              fill="url(#supplierGradient)"
              radius={[0, 6, 6, 0]}
              maxBarSize={22}
            >
              <LabelList
                dataKey="volume"
                position="right"
                formatter={(v: any) => `${v} MT`}
                style={{ fill: '#1E3A8A', fontSize: 11, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TopSuppliersChart
