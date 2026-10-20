import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  fetchDispatchRecords,
  createDispatchRecord as apiCreateDispatch,
  updateDispatchRecord as apiUpdateDispatch,
  deleteDispatchRecord as apiDeleteDispatch,
} from '@/services/dispatchService'
import type { DispatchEntry, DispatchFilters, DispatchSummary } from '@types'

export function useDispatch() {
  const [dispatches, setDispatches] = useState<DispatchEntry[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const loadDispatches = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchDispatchRecords()
      setDispatches(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch dispatch records'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDispatches()
  }, [loadDispatches])

  const getNextDispatchBillNumber = useCallback((): string => {
    let maxNumber = 2300
    for (const d of dispatches) {
      const match = (d.dispatch_bill_number || '').match(/DB-(\d+)/i)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num
        }
      }
    }
    return `DB-${maxNumber + 1}`
  }, [dispatches])

  const getTransporters = useCallback((): string[] => {
    const list = new Set<string>()
    dispatches.forEach((d) => {
      if (d.transporter && d.transporter.trim()) {
        list.add(d.transporter.trim())
      }
    })
    return Array.from(list).sort()
  }, [dispatches])

  const getDispatchById = useCallback(
    (id: string): DispatchEntry | undefined => {
      return dispatches.find((d) => d.id === id || d.dispatch_bill_number === id)
    },
    [dispatches]
  )

  const getDispatches = useCallback(
    (filters?: DispatchFilters): DispatchEntry[] => {
      if (!filters) return dispatches
      let result = [...dispatches]

      if (filters.search?.trim()) {
        const q = filters.search.toLowerCase().trim()
        result = result.filter(
          (d) =>
            (d.dispatch_bill_number || '').toLowerCase().includes(q) ||
            (d.bill_number || '').toLowerCase().includes(q) ||
            (d.lorry_number || '').toLowerCase().includes(q) ||
            (d.parties?.party_name || '').toLowerCase().includes(q) ||
            (d.parties?.party_code || '').toLowerCase().includes(q) ||
            (d.qualities?.quality_name || '').toLowerCase().includes(q) ||
            (d.transporter || '').toLowerCase().includes(q)
        )
      }

      if (filters.partyIds?.length) {
        result = result.filter((d) => filters.partyIds?.includes(d.party_id))
      }

      if (filters.qualityIds?.length) {
        result = result.filter((d) => filters.qualityIds?.includes(d.quality_id))
      }

      if (filters.status?.length) {
        result = result.filter((d) => filters.status?.includes(d.status))
      }

      if (filters.lorryNumber?.trim()) {
        const q = filters.lorryNumber.toLowerCase().trim()
        result = result.filter((d) => (d.lorry_number || '').toLowerCase().includes(q))
      }

      if (filters.transporter?.trim()) {
        const q = filters.transporter.toLowerCase().trim()
        result = result.filter((d) => (d.transporter || '').toLowerCase().includes(q))
      }

      if (filters.dateFrom) {
        const from = new Date(filters.dateFrom)
        from.setHours(0, 0, 0, 0)
        result = result.filter((d) => new Date(d.dispatch_date) >= from)
      }

      if (filters.dateTo) {
        const to = new Date(filters.dateTo)
        to.setHours(23, 59, 59, 999)
        result = result.filter((d) => new Date(d.dispatch_date) <= to)
      }

      if (filters.minWeight !== undefined && !isNaN(filters.minWeight)) {
        result = result.filter((d) => d.bill_weight >= filters.minWeight!)
      }

      if (filters.maxWeight !== undefined && !isNaN(filters.maxWeight)) {
        result = result.filter((d) => d.bill_weight <= filters.maxWeight!)
      }

      return result
    },
    [dispatches]
  )

  const getDispatchSummary = useCallback(
    (filters?: DispatchFilters): DispatchSummary => {
      const filtered = getDispatches(filters)
      const totalDispatches = filtered.length
      const totalWeightMT = filtered.reduce((acc, curr) => acc + (curr.bill_weight || 0), 0)
      const dispatchedCount = filtered.filter((d) => d.status === 'dispatched').length
      const draftCount = filtered.filter((d) => d.status === 'draft').length
      const cancelledCount = filtered.filter((d) => d.status === 'cancelled').length

      return {
        totalDispatches,
        totalBillWeight: Number(totalWeightMT.toFixed(3)),
        uniqueParties: new Set(filtered.map((d) => d.party_id)).size,
        uniqueLorries: new Set(filtered.map((d) => d.lorry_number)).size,
        uniqueTransporters: new Set(filtered.map((d) => d.transporter).filter(Boolean)).size,
        totalWeightMT: Number(totalWeightMT.toFixed(3)),
        totalWeightKG: Math.round(totalWeightMT * 1000),
        dispatchedCount,
        draftCount,
        cancelledCount,
      }
    },
    [getDispatches]
  )

  const createDispatch = async (
    data: Omit<DispatchEntry, 'id' | 'created_at' | 'updated_at'> & {
      outwardBillNo?: string
      dispatchDate?: string
      qualityGradeId?: string
      partyId?: string
      transporterId?: string | null
      lorryNo?: string
      billWtMt?: number | string
      purchaseBillNo?: string
    }
  ): Promise<DispatchEntry> => {
    setIsSaving(true)
    setError(null)
    try {
      const created = await apiCreateDispatch({
        outward_bill_no: data.outwardBillNo || data.dispatch_bill_number,
        dispatch_date: data.dispatchDate || data.dispatch_date,
        quality_grade_id: data.qualityGradeId || data.quality_id,
        party_id: data.partyId || data.party_id,
        transporter_id: data.transporterId || (data as any).transporter_id || null,
        lorry_no: data.lorryNo || data.lorry_number,
        bill_wt_mt: data.billWtMt ?? data.bill_weight,
        purchase_bill_no: data.purchaseBillNo || data.bill_number,
        status: data.status || 'dispatched',
        remarks: data.remarks,
      })

      setDispatches((prev) => [created, ...prev])
      toast.success('Dispatch entry saved successfully!')
      return created
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save dispatch entry'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const updateDispatch = async (
    id: string,
    data: Partial<DispatchEntry>
  ): Promise<DispatchEntry> => {
    setIsSaving(true)
    setError(null)
    try {
      const updated = await apiUpdateDispatch(id, {
        outward_bill_no: data.dispatch_bill_number,
        dispatch_date: data.dispatch_date,
        quality_grade_id: data.quality_id,
        party_id: data.party_id,
        lorry_no: data.lorry_number,
        bill_wt_mt: data.bill_weight,
        purchase_bill_no: data.bill_number,
        status: data.status,
      })

      setDispatches((prev) => prev.map((d) => (d.id === id || d.dispatch_bill_number === id ? updated : d)))
      toast.success('Dispatch record updated successfully')
      return updated
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update dispatch record'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const deleteDispatch = async (id: string): Promise<boolean> => {
    setIsSaving(true)
    setError(null)
    try {
      await apiDeleteDispatch(id)
      setDispatches((prev) => prev.filter((d) => d.id !== id && d.dispatch_bill_number !== id))
      toast.success('Dispatch entry deleted from database')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete dispatch'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return {
    dispatches,
    isLoading,
    isSaving,
    error,
    refetch: loadDispatches,
    getNextDispatchBillNumber,
    getTransporters,
    getDispatchById,
    getDispatches,
    getDispatchSummary,
    createDispatch,
    updateDispatch,
    deleteDispatch,
  }
}

export default useDispatch
