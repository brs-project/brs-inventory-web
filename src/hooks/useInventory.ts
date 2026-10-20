import { useState, useMemo, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  fetchInventoryTransactions,
  createInventoryTransaction as apiCreateTxn,
  updateInventoryTransaction as apiUpdateTxn,
  deleteInventoryTransaction as apiDeleteTxn,
} from '@/services/inventoryService'
import type { InventoryTransaction } from '@types'

export interface TransactionInput {
  transaction_date: Date | string
  transactionDate?: string
  party_id: string
  partyId?: string
  quality_id: string
  qualityGradeId?: string
  godown_id?: string
  vehicle_in_id?: string
  inwardLorryNumber?: string
  lorryNumber?: string
  bill_number?: string
  invoiceNo?: string
  billNo?: string
  inward_weight: number
  inwardWeight?: number
  weightMt?: number
  godown_weight: number
  vehicle_out_id?: string
  outward_weight: number
  remarks?: string
  status: 'draft' | 'completed' | 'cancelled'
  transactionType?: string
}

export interface TransactionFilters {
  search?: string
  dateFrom?: Date | string
  dateTo?: Date | string
  partyIds?: string[]
  qualityIds?: string[]
  godownIds?: string[]
  status?: string[]
  billNumber?: string
  lorryNumber?: string
  minWeight?: number
  maxWeight?: number
}

export function useInventory() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTransactions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchInventoryTransactions()
      setTransactions(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch inventory transactions'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const getNextBillNumber = useCallback((): string => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const maxNum = transactions.reduce((max, t) => {
      const match = (t.bill_number || '').match(/INV-\d{4}-(\d+)/i)
      if (match) {
        const num = parseInt(match[1], 10)
        return num > max ? num : max
      }
      return max
    }, 1000)
    return `INV-${yyyy}-${String(maxNum + 1).padStart(4, '0')}`
  }, [transactions])

  const getTransactionById = useCallback(
    (id: string): InventoryTransaction | undefined => {
      return transactions.find((t) => t.id === id || t.bill_number === id)
    },
    [transactions]
  )

  const getFilteredTransactions = useCallback(
    (filters?: TransactionFilters): InventoryTransaction[] => {
      if (!filters) return transactions

      return transactions.filter((t) => {
        if (filters.search && filters.search.trim() !== '') {
          const q = filters.search.toLowerCase().trim()
          const bill = (t.bill_number || '').toLowerCase()
          const party = (t.parties?.party_name || '').toLowerCase()
          const partyCode = (t.parties?.party_code || '').toLowerCase()
          const quality = (t.qualities?.quality_name || '').toLowerCase()
          const inLorry = (t.vehicle_in_id || t.lorry_number || '').toLowerCase()
          const matches =
            bill.includes(q) ||
            party.includes(q) ||
            partyCode.includes(q) ||
            quality.includes(q) ||
            inLorry.includes(q)
          if (!matches) return false
        }

        if (filters.dateFrom) {
          const from = new Date(filters.dateFrom)
          from.setHours(0, 0, 0, 0)
          const txnDate = new Date(t.transaction_date)
          if (txnDate < from) return false
        }

        if (filters.dateTo) {
          const to = new Date(filters.dateTo)
          to.setHours(23, 59, 59, 999)
          const txnDate = new Date(t.transaction_date)
          if (txnDate > to) return false
        }

        if (filters.partyIds && filters.partyIds.length > 0) {
          if (!filters.partyIds.includes(t.party_id)) return false
        }

        if (filters.qualityIds && filters.qualityIds.length > 0) {
          if (!filters.qualityIds.includes(t.quality_id)) return false
        }

        if (filters.status && filters.status.length > 0) {
          if (!filters.status.includes(t.status)) return false
        }

        if (filters.billNumber && filters.billNumber.trim() !== '') {
          const q = filters.billNumber.toLowerCase().trim()
          if (!t.bill_number?.toLowerCase().includes(q)) return false
        }

        if (filters.lorryNumber && filters.lorryNumber.trim() !== '') {
          const q = filters.lorryNumber.toLowerCase().trim()
          const inLorry = (t.vehicle_in_id || t.lorry_number || '').toLowerCase()
          if (!inLorry.includes(q)) return false
        }

        if (filters.minWeight !== undefined && !isNaN(filters.minWeight)) {
          if ((t.inward_weight || 0) < filters.minWeight) return false
        }

        if (filters.maxWeight !== undefined && !isNaN(filters.maxWeight)) {
          if ((t.inward_weight || 0) > filters.maxWeight) return false
        }

        return true
      })
    },
    [transactions]
  )

  const createTransaction = async (data: TransactionInput): Promise<InventoryTransaction> => {
    setIsSaving(true)
    setError(null)
    try {
      console.log('[useInventory.createTransaction] Submitting payload to service:', {
        party_id: data.party_id || data.partyId,
        quality_grade_id: data.quality_id || data.qualityGradeId,
        weight_mt: data.inward_weight ?? data.weightMt ?? data.inwardWeight ?? 0,
        transaction_date: data.transaction_date,
        bill_number: data.bill_number,
      })

      const created = await apiCreateTxn({
        transaction_date: data.transaction_date,
        transactionDate: data.transactionDate,
        invoice_no: data.bill_number || data.invoiceNo || data.billNo,
        party_id: data.party_id || data.partyId,
        quality_grade_id: data.quality_id || data.qualityGradeId,
        lorry_number: data.vehicle_in_id || data.lorryNumber || data.inwardLorryNumber,
        weight_mt: data.inward_weight ?? data.weightMt ?? data.inwardWeight ?? 0,
        transaction_type: data.transactionType || 'INWARD',
        status: data.status || 'Completed',
        remarks: data.remarks,
      })

      setTransactions((prev) => [created, ...prev])
      toast.success(`Transaction saved successfully! Bill: ${created.bill_number}`)
      return created
    } catch (err: any) {
      console.error('[useInventory.createTransaction] Error saving transaction:', err)
      const detail = err?.details ? ` (${err.details})` : ''
      const hint = err?.hint ? ` [Hint: ${err.hint}]` : ''
      const msg = err?.message ? `${err.message}${detail}${hint}` : 'Failed to save transaction'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const updateTransaction = async (
    id: string,
    data: Partial<TransactionInput>
  ): Promise<InventoryTransaction> => {
    setIsSaving(true)
    setError(null)
    try {
      const updated = await apiUpdateTxn(id, {
        transaction_date: data.transaction_date,
        transactionDate: data.transactionDate,
        invoice_no: data.bill_number || data.invoiceNo || data.billNo,
        party_id: data.party_id || data.partyId,
        quality_grade_id: data.quality_id || data.qualityGradeId,
        lorry_number: data.vehicle_in_id || data.lorryNumber || data.inwardLorryNumber,
        weight_mt: data.inward_weight ?? data.weightMt ?? data.inwardWeight,
        status: data.status,
      })

      setTransactions((prev) => prev.map((t) => (t.id === id || t.bill_number === id ? updated : t)))
      toast.success(`Transaction ${updated.bill_number} updated successfully`)
      return updated
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update transaction'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const deleteTransaction = async (id: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      await apiDeleteTxn(id)
      setTransactions((prev) => prev.filter((t) => t.id !== id && t.bill_number !== id))
      toast.success('Transaction deleted from database')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete transaction'
      setError(msg)
      toast.error(msg)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const stats = useMemo(() => {
    const totalCount = transactions.length
    const totalInward = transactions.reduce((sum, t) => sum + (t.inward_weight || 0), 0)
    const totalGodown = transactions.reduce((sum, t) => sum + (t.godown_weight || 0), 0)
    const totalVehicleLoad = transactions.reduce(
      (sum, t) => sum + (t.total_weight !== undefined ? t.total_weight : t.inward_weight || 0),
      0
    )
    const totalOutward = transactions.reduce((sum, t) => sum + (t.outward_weight || 0), 0)
    const totalVariance = transactions.reduce((sum, t) => sum + (t.weight_variance || 0), 0)
    const totalDispatchVariance = transactions.reduce((sum, t) => sum + (t.dispatch_variance || 0), 0)
    const netStock = transactions.reduce((sum, t) => sum + (t.net_stock || 0), 0)

    return {
      totalCount,
      totalInward: Math.round(totalInward * 1000) / 1000,
      totalGodown: Math.round(totalGodown * 1000) / 1000,
      totalVehicleLoad: Math.round(totalVehicleLoad * 1000) / 1000,
      totalOutward: Math.round(totalOutward * 1000) / 1000,
      totalVariance: Math.round(totalVariance * 1000) / 1000,
      totalDispatchVariance: Math.round(totalDispatchVariance * 1000) / 1000,
      netStock: Math.round(netStock * 1000) / 1000,
    }
  }, [transactions])

  return {
    transactions,
    stats,
    isLoading,
    isSaving,
    error,
    refetch: loadTransactions,
    getNextBillNumber,
    getTransactionById,
    getFilteredTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}

export default useInventory
