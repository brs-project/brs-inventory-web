import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatWeight } from '@lib/utils'

interface MonthlyDataItem {
  month: string
  inward: number
  outward: number
}

interface MonthlyBarChartProps {
  data: MonthlyDataItem[]
  isLoading?: boolean
}

export function MonthlyBarChart({ data, isLoading }: MonthlyBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[160px]">
          <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">Month: {label}</p>
          <div className="flex items-center justify-between text-blue-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              Inward:
            </span>
            <span className="font-mono font-bold">{formatWeight(payload[0].value)}</span>
          </div>
          <div className="flex items-center justify-between text-red-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
              Outward:
            </span>
            <span className="font-mono font-bold">{formatWeight(payload[1].value)}</span>
          </div>
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
          Monthly Inward vs Outward
        </h2>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Last 6 months volume comparison (MT)
        </p>
      </div>

      <div className="w-full h-[220px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tickFormatter={(v) => `${v} MT`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: 12, fontSize: '12px', fontWeight: 600 }}
              formatter={(value) => (
                <span className="text-slate-700 capitalize">
                  {value === 'inward' ? 'Inward Weight' : 'Outward Weight'}
                </span>
              )}
            />
            <Bar
              dataKey="inward"
              name="inward"
              fill="#2563EB"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="outward"
              name="outward"
              fill="#DC2626"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default MonthlyBarChart
