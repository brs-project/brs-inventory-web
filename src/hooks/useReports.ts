import { useState, useEffect, useMemo } from 'react'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { useParties, useQualities } from '@hooks/useMasterData'
import { useInventory } from '@hooks/useInventory'
import type { InventoryTransaction, Quality, Godown, Party } from '@types'

// ---------------------------------------------------------------------------
// 1. DAILY REPORT TYPES & HOOK
// ---------------------------------------------------------------------------

export interface DailyReportFilters {
  dateFrom?: Date | string
  dateTo?: Date | string
  partyIds?: string[]
  qualityIds?: string[]
  godownId?: string // 'all' or specific godown id
  groupBy?: 'none' | 'quality' | 'godown'
}

export interface DailyReportSummary {
  totalInward: number
  totalOutward: number
  totalVariance: number
  netPosition: number
  recordCount: number
}

export interface DailyTrendPoint {
  date: string
  formattedDate: string
  totalInward: number
  totalOutward: number
  netStock: number
}

export function useDailyReport(filters: DailyReportFilters) {
  const { transactions: mockInventoryTransactions } = useInventory()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [
    filters.dateFrom,
    filters.dateTo,
    JSON.stringify(filters.partyIds),
    JSON.stringify(filters.qualityIds),
    filters.godownId,
    filters.groupBy,
  ])

  // Filtered transactions
  const data = useMemo(() => {
    return mockInventoryTransactions.filter((t) => {
      // Date filter
      const txnDate = new Date(t.transaction_date)
      if (filters.dateFrom && filters.dateTo) {
        const from = startOfDay(new Date(filters.dateFrom))
        const to = endOfDay(new Date(filters.dateTo))
        if (!isWithinInterval(txnDate, { start: from, end: to })) return false
      } else if (filters.dateFrom) {
        if (txnDate < startOfDay(new Date(filters.dateFrom))) return false
      } else if (filters.dateTo) {
        if (txnDate > endOfDay(new Date(filters.dateTo))) return false
      }

      // Party filter
      if (filters.partyIds && filters.partyIds.length > 0) {
        if (!filters.partyIds.includes(t.party_id)) return false
      }

      // Quality filter
      if (filters.qualityIds && filters.qualityIds.length > 0) {
        if (!filters.qualityIds.includes(t.quality_id)) return false
      }

      // Godown filter
      if (filters.godownId && filters.godownId !== 'all') {
        if (t.godown_id !== filters.godownId) return false
      }

      return true
    })
  }, [
    filters.dateFrom,
    filters.dateTo,
    filters.partyIds,
    filters.qualityIds,
    filters.godownId,
  ])

  // Aggregate daily trend chart points
  const dailyTrend = useMemo<DailyTrendPoint[]>(() => {
    const map = new Map<string, { inward: number; outward: number; net: number }>()

    data.forEach((t) => {
      const dateKey = format(new Date(t.transaction_date), 'yyyy-MM-dd')
      const existing = map.get(dateKey) || { inward: 0, outward: 0, net: 0 }
      existing.inward += t.inward_weight || 0
      existing.outward += t.outward_weight || 0
      existing.net += t.net_stock || 0
      map.set(dateKey, existing)
    })

    return Array.from(map.entries())
      .map(([dateKey, val]) => ({
        date: dateKey,
        formattedDate: format(new Date(dateKey), 'dd MMM'),
        totalInward: Math.round(val.inward * 1000) / 1000,
        totalOutward: Math.round(val.outward * 1000) / 1000,
        netStock: Math.round(val.net * 1000) / 1000,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  // Summary figures
  const summary = useMemo<DailyReportSummary>(() => {
    const totalInward = data.reduce((acc, t) => acc + (t.inward_weight || 0), 0)
    const totalOutward = data.reduce((acc, t) => acc + (t.outward_weight || 0), 0)
    const totalVariance = data.reduce((acc, t) => acc + (t.weight_variance || 0), 0)
    const netPosition = data.reduce((acc, t) => acc + (t.net_stock || 0), 0)

    return {
      totalInward: Math.round(totalInward * 1000) / 1000,
      totalOutward: Math.round(totalOutward * 1000) / 1000,
      totalVariance: Math.round(totalVariance * 1000) / 1000,
      netPosition: Math.round(netPosition * 1000) / 1000,
      recordCount: data.length,
    }
  }, [data])

  return {
    data,
    dailyTrend,
    summary,
    isLoading,
  }
}

// ---------------------------------------------------------------------------
// 2. STOCK REPORT TYPES & HOOK
// ---------------------------------------------------------------------------

export interface StockReportFilters {
  asOfDate?: Date | string
  qualityIds?: string[]
  godownIds?: string[]
  showZeroStock?: boolean
}

export interface GodownStockBreakdown {
  godown: Godown
  totalInward: number
  totalOutward: number
  currentStock: number
  stockPercentage: number
}

export interface QualityStockRow {
  quality: Quality
  totalInward: number
  totalOutward: number
  currentStock: number
  stockPercentage: number
  godownBreakdowns: GodownStockBreakdown[]
}

export interface StockReportSummary {
  totalInward: number
  totalOutward: number
  currentStock: number
  totalQualities: number
  totalGodowns: number
}

export interface StockDonutPoint {
  name: string
  value: number
  color: string
  category?: string
}

const STOCK_DONUT_COLORS = [
  '#2563eb', // Blue-600
  '#10b981', // Emerald-500
  '#f59e0b', // Amber-500
  '#8b5cf6', // Purple-500
  '#ec4899', // Pink-500
  '#06b6d4', // Cyan-500
  '#64748b', // Slate-500
]

export function useStockReport(filters: StockReportFilters) {
  const { transactions: mockInventoryTransactions } = useInventory()
  const { qualities: [] } = useQualities()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [
    filters.asOfDate,
    JSON.stringify(filters.qualityIds),
    JSON.stringify(filters.godownIds),
    filters.showZeroStock,
  ])

  // Transactions up to asOfDate
  const relevantTransactions = useMemo(() => {
    const cutOff = filters.asOfDate ? endOfDay(new Date(filters.asOfDate)) : endOfDay(new Date())
    return mockInventoryTransactions.filter((t) => {
      const txnDate = new Date(t.transaction_date)
      if (txnDate > cutOff) return false
      if (t.status === 'cancelled') return false
      return true
    })
  }, [filters.asOfDate])

  // Calculate stock aggregated by Quality and Godown
  const { data, summary, donutData } = useMemo(() => {
    // 1. Calculate overall quality stock map
    const activeQualities = ([] as any[]).filter((q) => {
      if (filters.qualityIds && filters.qualityIds.length > 0) {
        return filters.qualityIds.includes(q.id)
      }
      return true
    })

    const activeGodowns = ([] as any[]).filter((g) => {
      if (filters.godownIds && filters.godownIds.length > 0) {
        return filters.godownIds.includes(g.id)
      }
      return true
    })

    let grandTotalStock = 0
    let grandTotalIn = 0
    let grandTotalOut = 0

    // Temporary storage for calculated rows
    const rows: QualityStockRow[] = []

    activeQualities.forEach((quality) => {
      // Find all transactions matching this quality
      const qualityTxns = relevantTransactions.filter((t) => t.quality_id === quality.id)

      let qInward = 0
      let qOutward = 0
      const godownBreakdowns: GodownStockBreakdown[] = []

      activeGodowns.forEach((godown) => {
        const godownTxns = qualityTxns.filter((t) => t.godown_id === godown.id)
        const gIn = godownTxns.reduce((sum, t) => sum + (t.inward_weight || 0), 0)
        const gOut = godownTxns.reduce((sum, t) => sum + (t.outward_weight || 0), 0)
        const gStock = Math.max(0, Math.round((gIn - gOut) * 1000) / 1000)

        qInward += gIn
        qOutward += gOut

        if (filters.showZeroStock || gStock > 0 || gIn > 0 || gOut > 0) {
          godownBreakdowns.push({
            godown,
            totalInward: Math.round(gIn * 1000) / 1000,
            totalOutward: Math.round(gOut * 1000) / 1000,
            currentStock: gStock,
            stockPercentage: 0, // will compute after quality stock is known
          })
        }
      })

      const qStock = Math.max(0, Math.round((qInward - qOutward) * 1000) / 1000)

      // Calculate godown percentage relative to quality stock
      godownBreakdowns.forEach((gb) => {
        gb.stockPercentage = qStock > 0 ? Math.round((gb.currentStock / qStock) * 100) : 0
      })

      if (filters.showZeroStock || qStock > 0 || qInward > 0) {
        rows.push({
          quality,
          totalInward: Math.round(qInward * 1000) / 1000,
          totalOutward: Math.round(qOutward * 1000) / 1000,
          currentStock: qStock,
          stockPercentage: 0,
          godownBreakdowns,
        })
        grandTotalStock += qStock
        grandTotalIn += qInward
        grandTotalOut += qOutward
      }
    })

    // Compute stock percentage of grand total
    rows.forEach((r) => {
      r.stockPercentage = grandTotalStock > 0 ? Math.round((r.currentStock / grandTotalStock) * 100) : 0
    })

    // Sort by currentStock descending
    rows.sort((a, b) => b.currentStock - a.currentStock)

    // Generate donut chart data
    const donutData: StockDonutPoint[] = rows
      .filter((r) => r.currentStock > 0)
      .map((r, idx) => ({
        name: r.quality.quality_name,
        value: r.currentStock,
        category: r.quality.category,
        color: STOCK_DONUT_COLORS[idx % STOCK_DONUT_COLORS.length],
      }))

    const summary: StockReportSummary = {
      totalInward: Math.round(grandTotalIn * 1000) / 1000,
      totalOutward: Math.round(grandTotalOut * 1000) / 1000,
      currentStock: Math.round(grandTotalStock * 1000) / 1000,
      totalQualities: rows.length,
      totalGodowns: activeGodowns.length,
    }

    return { data: rows, summary, donutData }
  }, [
    relevantTransactions,
    filters.qualityIds,
    filters.godownIds,
    filters.showZeroStock,
  ])

  return {
    data,
    summary,
    donutData,
    isLoading,
  }
}

// ---------------------------------------------------------------------------
// 3. PARTY REPORT TYPES & HOOK
// ---------------------------------------------------------------------------

export interface PartyReportFilters {
  dateFrom?: Date | string
  dateTo?: Date | string
  partyIds?: string[]
  qualityIds?: string[]
  groupBy?: 'party' | 'party_quality' | 'party_date'
}

export interface PartyQualityBreakdown {
  quality: Quality
  transactionCount: number
  totalInward: number
  totalOutward: number
  netStock: number
}

export interface PartyReportRow {
  party: Party
  transactionCount: number
  totalInward: number
  totalOutward: number
  netStock: number
  avgWeight: number
  qualityBreakdowns: PartyQualityBreakdown[]
}

export interface PartyReportSummary {
  totalParties: number
  totalTransactions: number
  totalInward: number
  totalOutward: number
  netStock: number
  avgWeight: number
}

export interface PartyVolumePoint {
  partyName: string
  totalInward: number
  totalOutward: number
  totalVolume: number
}

export function usePartyReport(filters: PartyReportFilters) {
  const { transactions: mockInventoryTransactions } = useInventory()
  const { parties: [] } = useParties()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [
    filters.dateFrom,
    filters.dateTo,
    JSON.stringify(filters.partyIds),
    JSON.stringify(filters.qualityIds),
    filters.groupBy,
  ])

  const filteredTxns = useMemo(() => {
    return mockInventoryTransactions.filter((t) => {
      if (t.status === 'cancelled') return false

      const txnDate = new Date(t.transaction_date)
      if (filters.dateFrom && filters.dateTo) {
        const from = startOfDay(new Date(filters.dateFrom))
        const to = endOfDay(new Date(filters.dateTo))
        if (!isWithinInterval(txnDate, { start: from, end: to })) return false
      } else if (filters.dateFrom) {
        if (txnDate < startOfDay(new Date(filters.dateFrom))) return false
      } else if (filters.dateTo) {
        if (txnDate > endOfDay(new Date(filters.dateTo))) return false
      }

      if (filters.partyIds && filters.partyIds.length > 0) {
        if (!filters.partyIds.includes(t.party_id)) return false
      }

      if (filters.qualityIds && filters.qualityIds.length > 0) {
        if (!filters.qualityIds.includes(t.quality_id)) return false
      }

      return true
    })
  }, [filters.dateFrom, filters.dateTo, filters.partyIds, filters.qualityIds])

  const { data, summary, chartData } = useMemo(() => {
    const activeParties = ([] as any[]).filter((p) => {
      if (filters.partyIds && filters.partyIds.length > 0) {
        return filters.partyIds.includes(p.id)
      }
      return true
    })

    const rows: PartyReportRow[] = []
    let grandIn = 0
    let grandOut = 0
    let grandNet = 0
    let grandTxns = 0

    activeParties.forEach((party) => {
      const partyTxns = filteredTxns.filter((t) => t.party_id === party.id)
      if (partyTxns.length === 0) return

      const inWeight = partyTxns.reduce((sum, t) => sum + (t.inward_weight || 0), 0)
      const outWeight = partyTxns.reduce((sum, t) => sum + (t.outward_weight || 0), 0)
      const net = partyTxns.reduce((sum, t) => sum + (t.net_stock || 0), 0)
      const count = partyTxns.length
      const avg = count > 0 ? inWeight / count : 0

      // Compute quality breakdown for this party
      const qualityMap = new Map<string, { in: number; out: number; net: number; count: number }>()
      partyTxns.forEach((t) => {
        const qid = t.quality_id
        const existing = qualityMap.get(qid) || { in: 0, out: 0, net: 0, count: 0 }
        existing.in += t.inward_weight || 0
        existing.out += t.outward_weight || 0
        existing.net += t.net_stock || 0
        existing.count += 1
        qualityMap.set(qid, existing)
      })

      const qualityBreakdowns: PartyQualityBreakdown[] = Array.from(qualityMap.entries()).map(
        ([qid, vals]) => {
          const qual = ([] as any[]).find((q) => q.id === qid) || {
            id: qid,
            quality_code: 'Q?',
            quality_name: 'Unknown Quality',
            unit_of_measure: 'MT',
            category: 'Scrap',
            is_active: true,
            created_at: new Date().toISOString(),
          }
          return {
            quality: qual,
            transactionCount: vals.count,
            totalInward: Math.round(vals.in * 1000) / 1000,
            totalOutward: Math.round(vals.out * 1000) / 1000,
            netStock: Math.round(vals.net * 1000) / 1000,
          }
        }
      )

      rows.push({
        party,
        transactionCount: count,
        totalInward: Math.round(inWeight * 1000) / 1000,
        totalOutward: Math.round(outWeight * 1000) / 1000,
        netStock: Math.round(net * 1000) / 1000,
        avgWeight: Math.round(avg * 1000) / 1000,
        qualityBreakdowns,
      })

      grandIn += inWeight
      grandOut += outWeight
      grandNet += net
      grandTxns += count
    })

    // Sort by inward volume descending
    rows.sort((a, b) => b.totalInward - a.totalInward)

    // Top parties for horizontal bar chart (top 6)
    const chartData: PartyVolumePoint[] = rows.slice(0, 8).map((r) => ({
      partyName: r.party.party_name,
      totalInward: r.totalInward,
      totalOutward: r.totalOutward,
      totalVolume: Math.round((r.totalInward + r.totalOutward) * 1000) / 1000,
    }))

    const summary: PartyReportSummary = {
      totalParties: rows.length,
      totalTransactions: grandTxns,
      totalInward: Math.round(grandIn * 1000) / 1000,
      totalOutward: Math.round(grandOut * 1000) / 1000,
      netStock: Math.round(grandNet * 1000) / 1000,
      avgWeight: grandTxns > 0 ? Math.round((grandIn / grandTxns) * 1000) / 1000 : 0,
    }

    return { data: rows, summary, chartData }
  }, [filteredTxns, filters.partyIds])

  return {
    data,
    summary,
    chartData,
    isLoading,
  }
}

// ---------------------------------------------------------------------------
// 4. VEHICLE REPORT TYPES & HOOK
// ---------------------------------------------------------------------------

export interface VehicleReportFilters {
  dateFrom?: Date | string
  dateTo?: Date | string
  lorryNumbers?: string[]
  movementType?: 'all' | 'inward_only' | 'outward_only'
  vehicleType?: 'all' | 'Heavy' | 'Medium' | 'Light'
}

export interface VehicleReportRow {
  lorryNumber: string
  ownerName: string
  vehicleType: string
  inwardTrips: number
  totalInwardMT: number
  outwardTrips: number
  totalOutwardMT: number
  totalTrips: number
  totalVolume: number
  transactions: InventoryTransaction[]
}

export interface VehicleReportSummary {
  totalVehicles: number
  totalTrips: number
  inwardTrips: number
  outwardTrips: number
  totalInwardMT: number
  totalOutwardMT: number
}

export interface VehicleVolumePoint {
  lorryNumber: string
  totalInward: number
  totalOutward: number
  totalVolume: number
}

export function useVehicleReport(filters: VehicleReportFilters) {
  const { transactions: mockInventoryTransactions } = useInventory()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 450)
    return () => clearTimeout(timer)
  }, [
    filters.dateFrom,
    filters.dateTo,
    JSON.stringify(filters.lorryNumbers),
    filters.movementType,
    filters.vehicleType,
  ])

  const filteredTxns = useMemo(() => {
    return mockInventoryTransactions.filter((t) => {
      if (t.status === 'cancelled') return false

      const txnDate = new Date(t.transaction_date)
      if (filters.dateFrom && filters.dateTo) {
        const from = startOfDay(new Date(filters.dateFrom))
        const to = endOfDay(new Date(filters.dateTo))
        if (!isWithinInterval(txnDate, { start: from, end: to })) return false
      } else if (filters.dateFrom) {
        if (txnDate < startOfDay(new Date(filters.dateFrom))) return false
      } else if (filters.dateTo) {
        if (txnDate > endOfDay(new Date(filters.dateTo))) return false
      }

      return true
    })
  }, [filters.dateFrom, filters.dateTo])

  const { data, summary, chartData } = useMemo(() => {
    const vehicleMap = new Map<
      string,
      {
        ownerName: string
        vehicleType: string
        inwardTrips: number
        inwardMT: number
        outwardTrips: number
        outwardMT: number
        transactions: InventoryTransaction[]
      }
    >()

    // Helper to register vehicle activity
    const recordVehicle = (
      plate: string,
      direction: 'in' | 'out',
      weight: number,
      txn: InventoryTransaction
    ) => {
      if (!plate || plate.trim() === '') return
      const cleanPlate = plate.trim().toUpperCase()

      // Check filters
      if (filters.lorryNumbers && filters.lorryNumbers.length > 0) {
        if (!filters.lorryNumbers.includes(cleanPlate)) return
      }

      const knownVehicle = ([] as any[]).find(
        (v) => v.lorry_number.toUpperCase() === cleanPlate
      )
      const vType = knownVehicle?.vehicle_type || 'Heavy'
      const vOwner = knownVehicle?.owner_name || 'Fleet Transporter'

      if (filters.vehicleType && filters.vehicleType !== 'all') {
        if (vType !== filters.vehicleType) return
      }

      const existing = vehicleMap.get(cleanPlate) || {
        ownerName: vOwner,
        vehicleType: vType,
        inwardTrips: 0,
        inwardMT: 0,
        outwardTrips: 0,
        outwardMT: 0,
        transactions: [] as InventoryTransaction[],
      }

      if (direction === 'in') {
        existing.inwardTrips += 1
        existing.inwardMT += weight
      } else {
        existing.outwardTrips += 1
        existing.outwardMT += weight
      }

      if (!existing.transactions.some((t) => t.id === txn.id)) {
        existing.transactions.push(txn)
      }

      vehicleMap.set(cleanPlate, existing)
    }

    filteredTxns.forEach((txn) => {
      const inPlate = txn.vehicles_in?.lorry_number || txn.vehicle_in_id
      const outPlate = txn.vehicles_out?.lorry_number || txn.vehicle_out_id

      if (filters.movementType !== 'outward_only' && inPlate && (txn.inward_weight || 0) > 0) {
        recordVehicle(inPlate, 'in', txn.inward_weight, txn)
      }

      if (filters.movementType !== 'inward_only' && outPlate && (txn.outward_weight || 0) > 0) {
        recordVehicle(outPlate, 'out', txn.outward_weight, txn)
      }
    })

    const rows: VehicleReportRow[] = []
    let grandInTrips = 0
    let grandOutTrips = 0
    let grandInMT = 0
    let grandOutMT = 0

    Array.from(vehicleMap.entries()).forEach(([lorryNumber, val]) => {
      const totalTrips = val.inwardTrips + val.outwardTrips
      const totalVolume = val.inwardMT + val.outwardMT

      if (totalTrips > 0) {
        rows.push({
          lorryNumber,
          ownerName: val.ownerName,
          vehicleType: val.vehicleType,
          inwardTrips: val.inwardTrips,
          totalInwardMT: Math.round(val.inwardMT * 1000) / 1000,
          outwardTrips: val.outwardTrips,
          totalOutwardMT: Math.round(val.outwardMT * 1000) / 1000,
          totalTrips,
          totalVolume: Math.round(totalVolume * 1000) / 1000,
          transactions: val.transactions,
        })

        grandInTrips += val.inwardTrips
        grandOutTrips += val.outwardTrips
        grandInMT += val.inwardMT
        grandOutMT += val.outwardMT
      }
    })

    // Sort by total volume descending
    rows.sort((a, b) => b.totalVolume - a.totalVolume)

    // Top 10 vehicles by total volume for chart
    const chartData: VehicleVolumePoint[] = rows.slice(0, 10).map((r) => ({
      lorryNumber: r.lorryNumber,
      totalInward: r.totalInwardMT,
      totalOutward: r.totalOutwardMT,
      totalVolume: r.totalVolume,
    }))

    const summary: VehicleReportSummary = {
      totalVehicles: rows.length,
      totalTrips: grandInTrips + grandOutTrips,
      inwardTrips: grandInTrips,
      outwardTrips: grandOutTrips,
      totalInwardMT: Math.round(grandInMT * 1000) / 1000,
      totalOutwardMT: Math.round(grandOutMT * 1000) / 1000,
    }

    return { data: rows, summary, chartData }
  }, [
    filteredTxns,
    filters.lorryNumbers,
    filters.movementType,
    filters.vehicleType,
  ])

  return {
    data,
    summary,
    chartData,
    isLoading,
  }
}
