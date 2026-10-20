import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import supabase from '@/services/supabaseClient'

export function useDashboard() {
  const [manualLoading, setManualLoading] = useState(false)

  const query = useQuery({
    queryKey: ['dashboard-metrics-live'],
    queryFn: async () => {
      // 1. Fetch live transactions
      const { data: invTxns } = await supabase
        .from('inventory_transactions')
        .select('*, parties(name, code), quality_grades(name, hsn_code)')
        .order('created_at', { ascending: false })
        .limit(50)

      // 2. Fetch live dispatches
      const { data: dispatches } = await supabase
        .from('dispatch_records')
        .select('*, parties!party_id(name, code), quality_grades(name, hsn_code)')
        .order('created_at', { ascending: false })
        .limit(50)

      // 3. Fetch live parties & quality grades
      const { data: parties } = await supabase.from('parties').select('*')
      const { data: qualities } = await supabase.from('quality_grades').select('*')

      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
      const totalInwardToday = (invTxns || [])
        .filter((t) => t.transaction_date === todayStr)
        .reduce((sum, t) => sum + (Number(t.weight_mt) || 0), 0)

      const totalOutwardToday = (dispatches || [])
        .filter((d) => d.dispatch_date === todayStr)
        .reduce((sum, d) => sum + (Number(d.bill_wt_mt) || 0), 0)

      const totalInwardAll = (invTxns || []).reduce((sum, t) => sum + (Number(t.weight_mt) || 0), 0)
      const totalOutwardAll = (dispatches || []).reduce((sum, d) => sum + (Number(d.bill_wt_mt) || 0), 0)
      const currentStock = Math.max(0, Math.round((totalInwardAll - totalOutwardAll) * 1000) / 1000)

      const lorriesSet = new Set<string>()
      ;(invTxns || []).forEach((t) => {
        if (t.transaction_date === todayStr && t.lorry_number) lorriesSet.add(t.lorry_number)
      })
      ;(dispatches || []).forEach((d) => {
        if (d.dispatch_date === todayStr && d.lorry_no) lorriesSet.add(d.lorry_no)
      })

      const kpis = {
        totalInwardToday: Number(totalInwardToday.toFixed(3)),
        totalOutwardToday: Number(totalOutwardToday.toFixed(3)),
        totalInwardWeek: Number(totalInwardAll.toFixed(3)),
        totalOutwardWeek: Number(totalOutwardAll.toFixed(3)),
        currentStock,
        activeLorriesToday: lorriesSet.size,
      }

      // Recent unified transactions for table
      const recentTransactions = [
        ...(invTxns || []).map((t) => ({
          id: t.id,
          date: t.transaction_date,
          party: t.parties?.name || 'Party',
          quality: t.quality_grades?.name || 'Grade',
          lorryNumber: t.lorry_number || '—',
          weight: Number(t.weight_mt) || 0,
          type: 'Inward' as const,
          status: 'Completed' as const,
        })),
        ...(dispatches || []).map((d) => ({
          id: d.id,
          date: d.dispatch_date,
          party: d.parties?.name || 'Buyer',
          quality: d.quality_grades?.name || 'Grade',
          lorryNumber: d.lorry_no || '—',
          weight: Number(d.bill_wt_mt) || 0,
          type: 'Outward' as const,
          status: 'Completed' as const,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)

      const PALETTE = ['#2563EB', '#16A34A', '#9333EA', '#EA580C', '#DC2626', '#0891B2']
      const qualityStock = (qualities || []).map((q, idx) => {
        const qInv = (invTxns || [])
          .filter((t) => t.quality_grade_id === q.id)
          .reduce((sum, t) => sum + (Number(t.weight_mt) || 0), 0)
        return {
          name: q.name,
          value: Number(qInv.toFixed(2)),
          color: PALETTE[idx % PALETTE.length],
        }
      })

      const topSuppliers = (parties || [])
        .slice(0, 5)
        .map((p) => {
          const pInv = (invTxns || [])
            .filter((t) => t.party_id === p.id)
            .reduce((sum, t) => sum + (Number(t.weight_mt) || 0), 0)
          return {
            name: p.name,
            volume: Number(pInv.toFixed(2)),
          }
        })

      // Group last 7 days for trend
      const dailyTrendMap = new Map<string, { total_inward: number; total_outward: number }>()
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
        dailyTrendMap.set(dStr, { total_inward: 0, total_outward: 0 })
      }
      ;(invTxns || []).forEach((t) => {
        if (dailyTrendMap.has(t.transaction_date)) {
          dailyTrendMap.get(t.transaction_date)!.total_inward += Number(t.weight_mt) || 0
        }
      })
      ;(dispatches || []).forEach((d) => {
        if (dailyTrendMap.has(d.dispatch_date)) {
          dailyTrendMap.get(d.dispatch_date)!.total_outward += Number(d.bill_wt_mt) || 0
        }
      })
      const dailyTrend = Array.from(dailyTrendMap.entries()).map(([date, vals]) => ({
        date,
        total_inward: Number(vals.total_inward.toFixed(2)),
        total_outward: Number(vals.total_outward.toFixed(2)),
      }))

      // Month grouped
      const monthlyData = [
        {
          month: new Date().toLocaleString('default', { month: 'short' }),
          inward: Number(totalInwardAll.toFixed(2)),
          outward: Number(totalOutwardAll.toFixed(2)),
        },
      ]

      return {
        kpis,
        dailyTrend,
        qualityStock,
        monthlyData,
        topSuppliers,
        recentTransactions,
      }
    },
    staleTime: 30 * 1000,
  })

  const refresh = async () => {
    setManualLoading(true)
    await query.refetch()
    setManualLoading(false)
  }

  const defaultData = {
    kpis: {
      totalInwardToday: 0,
      totalOutwardToday: 0,
      totalInwardWeek: 0,
      totalOutwardWeek: 0,
      currentStock: 0,
      activeLorriesToday: 0,
    },
    dailyTrend: [],
    qualityStock: [],
    monthlyData: [],
    topSuppliers: [],
    recentTransactions: [],
  }

  return {
    data: query.data || defaultData,
    isLoading: query.isLoading || manualLoading,
    isRefetching: query.isRefetching || manualLoading,
    refetch: refresh,
  }
}

export default useDashboard
