import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import {
  fetchBillSettlements,
  createBillSettlement as apiCreateBill,
  updateBillSettlement as apiUpdateBill,
  settleBillPayment as apiSettleBill,
  deleteBillSettlement as apiDeleteBill,
} from '@/services/billingService'
import type { BillEntry, BillFilters, BillSummary, Party } from '@types'

export function useDispatchPartyLookup() {
  const getPartyByCode = useCallback((_code: string): Party | undefined => {
    return undefined
  }, [])

  const getCodeByPartyId = useCallback((_partyId: string): string => {
    return '—'
  }, [])

  return { getPartyByCode, getCodeByPartyId }
}

export function useBill() {
  const [entries, setEntries] = useState<BillEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadBillEntries = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchBillSettlements()
      setEntries(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch bill settlements'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBillEntries()
  }, [loadBillEntries])

  const getPartyCodes = useCallback((): string[] => {
    const codes = new Set<string>()
    entries.forEach((e) => {
      if (e.party_code) codes.add(e.party_code)
    })
    return Array.from(codes).sort()
  }, [entries])

  const getPartyByCode = useCallback(
    (code: string): Party | undefined => {
      if (!code) return undefined
      const clean = code.trim().toUpperCase()
      const found = entries.find((e) => (e.party_code || '').toUpperCase() === clean)
      return found?.parties
    },
    [entries]
  )

  const getBillById = useCallback(
    (id: string): BillEntry | undefined => {
      return entries.find((e) => e.id === id || e.bill_number === id)
    },
    [entries]
  )

  const getBillEntries = useCallback(
    (filters?: BillFilters): BillEntry[] => {
      if (!filters) return entries
      let result = [...entries]

      if (filters.search?.trim()) {
        const q = filters.search.toLowerCase().trim()
        result = result.filter(
          (e) =>
            (e.bill_number || '').toLowerCase().includes(q) ||
            (e.parties?.party_name || '').toLowerCase().includes(q) ||
            (e.party_code || '').toLowerCase().includes(q) ||
            (e.lorry_number || '').toLowerCase().includes(q) ||
            (e.rtgs_reference || '').toLowerCase().includes(q)
        )
      }

      if (filters.party_id && filters.party_id !== 'all') {
        result = result.filter((e) => e.party_id === filters.party_id || e.party_code === filters.party_id)
      }

      if (filters.party_code && filters.party_code !== 'all') {
        result = result.filter((e) => (e.party_code || '').toLowerCase() === filters.party_code?.toLowerCase())
      }

      if (filters.billing_type && filters.billing_type !== 'all') {
        result = result.filter((e) => e.billing_type === filters.billing_type)
      }

      if (filters.payment_status && filters.payment_status !== 'all') {
        result = result.filter((e) => e.payment_status === filters.payment_status)
      }

      if (filters.date_from) {
        const from = new Date(filters.date_from)
        from.setHours(0, 0, 0, 0)
        result = result.filter((e) => new Date(e.bill_date) >= from)
      }

      if (filters.date_to) {
        const to = new Date(filters.date_to)
        to.setHours(23, 59, 59, 999)
        result = result.filter((e) => new Date(e.bill_date) <= to)
      }

      return result
    },
    [entries]
  )

  const getBillSummary = useCallback(
    (filters?: BillFilters): BillSummary => {
      const filtered = getBillEntries(filters)
      const totalBills = filtered.length
      const totalMT = filtered.reduce((acc, curr) => acc + (curr.quantity_mt || 0), 0)
      const underCount = filtered.filter((e) => e.billing_type === 'under').length
      const overCount = filtered.filter((e) => e.billing_type === 'over').length
      const exactCount = filtered.filter((e) => e.billing_type === 'exact').length
      const totalPayableRTGS = filtered
        .filter((e) => e.billing_type === 'under' && e.payment_status !== 'paid')
        .reduce((acc, curr) => acc + Math.abs(curr.rtgs_amount), 0)
      const totalReceivableRTGS = filtered
        .filter((e) => e.billing_type === 'over' && e.payment_status !== 'paid')
        .reduce((acc, curr) => acc + Math.abs(curr.rtgs_amount), 0)
      const netRTGS = totalPayableRTGS - totalReceivableRTGS

      return {
        totalEntries: totalBills,
        totalQuantityMT: Number(totalMT.toFixed(3)),
        totalQuantityKG: Math.round(totalMT * 1000),
        totalRtgsAmount: totalPayableRTGS + totalReceivableRTGS,
        underBillingCount: underCount,
        overBillingCount: overCount,
        exactBillingCount: exactCount,
        totalUnderBillingAmount: totalPayableRTGS,
        totalOverBillingAmount: totalReceivableRTGS,
        netRtgsPayable: netRTGS,
        avgBillRate: 0,
        avgActualRate: 0,
        totalBills,
        totalMT: Number(totalMT.toFixed(3)),
        totalPayableRTGS,
        totalReceivableRTGS,
        netRTGS,
        underCount,
        overCount,
        exactCount,
      }
    },
    [getBillEntries]
  )

  const createBillEntry = async (
    data: Omit<
      BillEntry,
      | 'id'
      | 'created_at'
      | 'updated_at'
      | 'rate_difference'
      | 'rtgs_amount'
      | 'quantity_kg'
      | 'billing_type'
      | 'parties'
      | 'qualities'
    > & {
      dispatchId?: string | null
      partyId?: string
      billDate?: string
      quantityMt?: number
      actualRate?: number
      billRate?: number
      paymentStatus?: string
      bankUtr?: string | null
      paymentMode?: string | null
      notes?: string | null
      quality_grade_id?: string
      qualityGradeId?: string
      lorry_no?: string
      lorryNo?: string
    }
  ): Promise<BillEntry> => {
    setIsSaving(true)
    try {
      const created = await apiCreateBill({
        dispatch_id: data.dispatchId || (data as any).dispatch_id || null,
        party_id: data.partyId || data.party_id,
        party_code: data.party_code,
        quality_grade_id: data.quality_grade_id || data.qualityGradeId || data.quality_id,
        quality_id: data.quality_id,
        bill_date: data.billDate || data.bill_date,
        bill_number: data.bill_number,
        quantity_mt: data.quantityMt ?? data.quantity_mt,
        actual_rate: data.actualRate ?? data.actual_rate,
        bill_rate: data.billRate ?? data.bill_rate,
        lorry_no: data.lorry_no || data.lorryNo || data.lorry_number,
        lorry_number: data.lorry_number,
        payment_status: data.paymentStatus || data.payment_status || 'pending',
        bank_utr: data.bankUtr || data.bank_utr || data.rtgs_reference,
        payment_mode: data.paymentMode || (data as any).payment_mode || 'RTGS',
        notes: data.notes || data.remarks,
      })

      setEntries((prev) => [created, ...prev])
      toast.success('Bill settlement recorded successfully!')
      return created
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save bill entry'
      toast.error(msg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const updateBillEntry = async (
    id: string,
    data: Partial<BillEntry>
  ): Promise<BillEntry> => {
    setIsSaving(true)
    try {
      const updated = await apiUpdateBill(id, {
        party_id: data.party_id,
        bill_date: data.bill_date,
        quantity_mt: data.quantity_mt,
        actual_rate: data.actual_rate,
        bill_rate: data.bill_rate,
        payment_status: data.payment_status,
        bank_utr: data.rtgs_reference,
        notes: data.remarks,
      })

      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
      toast.success('Bill record updated successfully')
      return updated
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update bill'
      toast.error(msg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const markAsPaid = async (
    id: string,
    utrNumber: string,
    _meta?: any
  ): Promise<BillEntry> => {
    setIsSaving(true)
    try {
      const updated = await apiSettleBill(id, utrNumber)
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)))
      toast.success('Payment marked as settled in database!')
      return updated
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to settle payment'
      toast.error(msg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const bulkMarkAsPaid = async (
    ids: string[],
    utrNumber: string,
    _meta?: any
  ): Promise<void> => {
    setIsSaving(true)
    try {
      for (const id of ids) {
        await apiSettleBill(id, utrNumber)
      }
      await loadBillEntries()
      toast.success(`${ids.length} entries marked as paid!`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to bulk settle'
      toast.error(msg)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  const deleteBillEntry = async (id: string): Promise<boolean> => {
    try {
      await apiDeleteBill(id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
      toast.success('Bill entry deleted from database')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete bill entry'
      toast.error(msg)
      throw err
    }
  }

  return {
    entries,
    isLoading,
    isSaving,
    refetch: loadBillEntries,
    getPartyCodes,
    getPartyByCode,
    getBillById,
    getBillEntries,
    getBillSummary,
    createBillEntry,
    updateBillEntry,
    markAsPaid,
    bulkMarkAsPaid,
    deleteBillEntry,
  }
}

export default useBill
