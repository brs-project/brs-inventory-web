import { useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Truck,
  RotateCw,
  PlusCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { PageHeader } from '@components/ui/PageHeader'
import { KPICard } from '@components/dashboard/KPICard'
import { InwardOutwardChart } from '@components/dashboard/InwardOutwardChart'
import { QualityPieChart } from '@components/dashboard/QualityPieChart'
import { MonthlyBarChart } from '@components/dashboard/MonthlyBarChart'
import { TopSuppliersChart } from '@components/dashboard/TopSuppliersChart'
import { RecentTransactions } from '@components/dashboard/RecentTransactions'
import { useDashboard } from '@hooks/useDashboard'
import { formatWeight } from '@lib/utils'

export function Dashboard() {
  const { data, isLoading, isRefetching, refetch } = useDashboard()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
    toast.success('Dashboard metrics refreshed successfully')
  }

  const currentDateText = format(new Date(), 'EEEE, dd MMMM yyyy')

  return (
    <div className="space-y-6 max-w-full">
      {/* =========================================================================
          PAGE HEADER: Title, Date Subtitle & Actions
      ========================================================================= */}
      <PageHeader
        title="Dashboard"
        subtitle={`Live operational overview &bull; ${currentDateText}`}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading || isRefetching || isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 text-xs font-semibold shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              <RotateCw
                className={`h-4 w-4 text-blue-600 ${
                  isRefetching || isRefreshing ? 'animate-spin' : ''
                }`}
              />
              <span>Refresh</span>
            </button>

            <Link
              to="/inventory/add"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-md shadow-blue-600/25 transition"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Entry</span>
            </Link>
          </div>
        }
      />

      {/* =========================================================================
          ROW 1: KPI Cards (4 columns grid, 2 on mobile)
      ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Total Inward Today */}
        <KPICard
          title="Total Inward Today"
          value={formatWeight(data.kpis.totalInwardToday).replace(' MT', '')}
          unit="MT"
          subtitle="Weighbridge In"
          icon={<ArrowDownRight className="h-6 w-6" />}
          color="blue"
          trend="up"
          trendValue="↑ 12% vs yesterday"
          isLoading={isLoading}
        />

        {/* Total Outward Today */}
        <KPICard
          title="Total Outward Today"
          value={formatWeight(data.kpis.totalOutwardToday).replace(' MT', '')}
          unit="MT"
          subtitle="Dispatch Out"
          icon={<ArrowUpRight className="h-6 w-6" />}
          color="red"
          trend="down"
          trendValue="↓ 8% vs yesterday"
          isLoading={isLoading}
        />

        {/* Current Stock */}
        <KPICard
          title="Current Stock"
          value={formatWeight(data.kpis.currentStock).replace(' MT', '')}
          unit="MT"
          subtitle="Across All Godowns"
          icon={<Package className="h-6 w-6" />}
          color="green"
          trend="up"
          trendValue="↑ 5% this week"
          isLoading={isLoading}
        />

        {/* Active Lorries */}
        <KPICard
          title="Active Lorries"
          value={data.kpis.activeLorriesToday}
          unit="Trucks"
          subtitle="Today"
          icon={<Truck className="h-6 w-6" />}
          color="amber"
          isLoading={isLoading}
        />
      </div>

      {/* =========================================================================
          ROW 2: Charts (2 column grid: InwardOutwardChart 2cols, QualityPie 1col)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InwardOutwardChart data={data.dailyTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <QualityPieChart data={data.qualityStock} isLoading={isLoading} />
        </div>
      </div>

      {/* =========================================================================
          ROW 3: Charts (2 column grid: MonthlyBarChart & TopSuppliersChart)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <MonthlyBarChart data={data.monthlyData} isLoading={isLoading} />
        </div>
        <div>
          <TopSuppliersChart data={data.topSuppliers} isLoading={isLoading} />
        </div>
      </div>

      {/* =========================================================================
          ROW 4: Recent Transactions Table (Full Width)
      ========================================================================= */}
      <div>
        <RecentTransactions transactions={data.recentTransactions} isLoading={isLoading} />
      </div>
    </div>
  )
}

export default Dashboard
