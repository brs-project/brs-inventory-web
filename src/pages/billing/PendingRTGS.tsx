import { formatISTDateTime } from '@lib/dateUtils'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  X,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ChevronDown,
  Clock,
} from 'lucide-react'
import { useBill } from '@hooks/useBill'
import {
  PendingKPICards,
  PendingTabBar,
  PendingFilterRow,
  PendingBulkBar,
  PendingTable,
  type PendingTabType,
  type PendingKPISummary,
} from '@components/billing/pending'
import { BillDetailModal } from '@components/billing/BillDetailModal'
import { MarkAsPaidModal } from '@components/billing/MarkAsPaidModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import { useQualities } from '@hooks/useMasterData'
import { getPendingRTGSExcelConfig, getPendingRTGSPDFConfig } from '@lib/reportConfigs'
import { exportToExcel } from '@lib/exportExcel'
import { exportToPDF } from '@lib/exportPDF'
import type { BillEntry } from '@types'

export function PendingRTGS() {
  const navigate = useNavigate()
  const { qualities: masterQualities } = useQualities()
  const {
    entries,
    markAsPaid,
    bulkMarkAsPaid,
    deleteBillEntry,
  } = useBill()

  // State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<PendingTabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [qualityFilter, setQualityFilter] = useState('all')
  const [agedFilter, setAgedFilter] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Modals state
  const [selectedEntry, setSelectedEntry] = useState<BillEntry | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [payTargetEntry, setPayTargetEntry] = useState<BillEntry | null>(null)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [isBulkPayOpen, setIsBulkPayOpen] = useState(false)
  const [deleteEntry, setDeleteEntry] = useState<BillEntry | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate Days Aging
  const getAgingDays = useCallback((billDate: string): number => {
    const diff = new Date().getTime() - new Date(billDate).getTime()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  }, [])

  // Base Pending Dataset (payment pending or partial, not exact)
  const basePendingEntries = useMemo(() => {
    return entries.filter(
      (e) =>
        (e.payment_status === 'pending' || e.payment_status === 'partial') &&
        e.billing_type !== 'exact'
    )
  }, [entries])

  // Counts for Quick Tab Bar
  const tabCounts = useMemo(() => {
    const all = basePendingEntries.length
    const under = basePendingEntries.filter(
      (e) => e.billing_type === 'under' && e.payment_status === 'pending'
    ).length
    const partial = basePendingEntries.filter(
      (e) => e.payment_status === 'partial'
    ).length
    return { all, under, partial }
  }, [basePendingEntries])

  // Comprehensive KPI Summary
  const kpiSummary: PendingKPISummary = useMemo(() => {
    let totalOutstanding = 0
    let fullPendingAmount = 0
    let partialPendingAmount = 0
    let fullPendingCount = 0
    let partialPendingCount = 0
    let underCount = 0
    let partialCount = 0
    let totalWeightMT = 0
    let oldestDays = 0
    let oldestEntry: BillEntry | undefined
    let freshCount = 0
    let warningCount = 0
    let criticalCount = 0

    for (const e of basePendingEntries) {
      const amt = Math.abs(e.rtgs_amount)
      totalOutstanding += amt
      totalWeightMT += e.quantity_mt || 0

      const days = getAgingDays(e.bill_date)
      if (days > 15) {
        criticalCount++
      } else if (days >= 7) {
        warningCount++
      } else {
        freshCount++
      }

      if (days > oldestDays) {
        oldestDays = days
        oldestEntry = e
      }

      if (e.payment_status === 'partial') {
        partialCount++
        partialPendingCount++
        partialPendingAmount += amt
      } else {
        fullPendingCount++
        fullPendingAmount += amt
        if (e.billing_type === 'under') {
          underCount++
        }
      }
    }

    return {
      totalOutstanding,
      fullPendingAmount,
      partialPendingAmount,
      fullPendingCount,
      partialPendingCount,
      pendingEntriesCount: basePendingEntries.length,
      underCount,
      partialCount,
      totalWeightMT,
      totalWeightKG: totalWeightMT * 1000,
      oldestPendingDays: oldestDays,
      oldestPendingPartyCode: oldestEntry?.party_code || oldestEntry?.parties?.party_code,
      oldestPendingPartyName: oldestEntry?.parties?.party_name,
      oldestPendingAmount: oldestEntry ? Math.abs(oldestEntry.rtgs_amount) : 0,
      freshCount,
      warningCount,
      criticalCount,
    }
  }, [basePendingEntries, getAgingDays])

  // Filtered Dataset
  const filteredEntries = useMemo(() => {
    let list = [...basePendingEntries]

    // Tab Filter
    if (activeTab === 'under') {
      list = list.filter(
        (e) => e.billing_type === 'under' && e.payment_status === 'pending'
      )
    } else if (activeTab === 'partial') {
      list = list.filter((e) => e.payment_status === 'partial')
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((e) => {
        const partyCode = (e.party_code || e.parties?.party_code || '').toLowerCase()
        const partyName = (e.parties?.party_name || '').toLowerCase()
        const lorry = (e.lorry_number || '').toLowerCase().replace(/\s+/g, '')
        const billNo = (e.bill_number || '').toLowerCase()
        const qClean = q.replace(/\s+/g, '')

        return (
          partyCode.includes(q) ||
          partyName.includes(q) ||
          lorry.includes(qClean) ||
          billNo.includes(q)
        )
      })
    }

    // Quality Filter
    if (qualityFilter !== 'all') {
      list = list.filter((e) => e.quality_id === qualityFilter)
    }

    // Aging Filter
    if (agedFilter !== 'all') {
      if (agedFilter === 'critical') {
        list = list.filter((e) => getAgingDays(e.bill_date) > 15)
      } else if (agedFilter === 'warning') {
        list = list.filter((e) => {
          const d = getAgingDays(e.bill_date)
          return d >= 7 && d <= 15
        })
      } else if (agedFilter === 'fresh') {
        list = list.filter((e) => getAgingDays(e.bill_date) < 7)
      } else {
        const threshold = Number(agedFilter)
        if (!isNaN(threshold)) {
          list = list.filter((e) => getAgingDays(e.bill_date) > threshold)
        }
      }
    }

    return list
  }, [basePendingEntries, activeTab, searchQuery, qualityFilter, agedFilter, getAgingDays])

  // Selected entry objects for bulk operations
  const selectedEntries = useMemo(() => {
    return basePendingEntries.filter((e) => selectedIds.includes(e.id))
  }, [basePendingEntries, selectedIds])

  const totalSelectedAmount = useMemo(() => {
    return selectedEntries.reduce((sum, e) => sum + Math.abs(e.rtgs_amount), 0)
  }, [selectedEntries])

  const totalSelectedMT = useMemo(() => {
    return selectedEntries.reduce((sum, e) => sum + (e.quantity_mt || 0), 0)
  }, [selectedEntries])

  // Selection Handlers
  const handleToggleSelectAll = useCallback(() => {
    if (filteredEntries.length === 0) return
    if (selectedIds.length === filteredEntries.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredEntries.map((e) => e.id))
    }
  }, [filteredEntries, selectedIds])

  const handleToggleSelectRow = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  // Filter Reset
  const hasActiveFilters =
    searchQuery !== '' || qualityFilter !== 'all' || agedFilter !== 'all'

  const handleResetFilters = useCallback(() => {
    setSearchQuery('')
    setQualityFilter('all')
    setAgedFilter('all')
    setActiveTab('all')
  }, [])

  // Action Handlers
  const handleView = useCallback((entry: BillEntry) => {
    setSelectedEntry(entry)
    setIsDetailOpen(true)
  }, [])

  const handleEdit = useCallback((entry: BillEntry) => {
    navigate(`/billing/edit/${entry.id}`)
  }, [navigate])

  const handleDelete = useCallback((entry: BillEntry) => {
    setDeleteEntry(entry)
    setIsDeleteOpen(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (deleteEntry) {
      await deleteBillEntry(deleteEntry.id)
      setSelectedIds((prev) => prev.filter((id) => id !== deleteEntry.id))
      setIsDeleteOpen(false)
      setDeleteEntry(null)
    }
  }

  const handlePayClick = useCallback((entry: BillEntry) => {
    setPayTargetEntry(entry)
    setIsPayOpen(true)
  }, [])

  const handleConfirmSinglePay = async (data: {
    rtgsReference: string
    paymentStatus: 'paid' | 'partial'
    amountPaid?: number
    paymentDate: string
    remarks?: string
    entryIds: string[]
  }) => {
    if (payTargetEntry) {
      await markAsPaid(payTargetEntry.id, data.rtgsReference, {
        paymentStatus: data.paymentStatus,
        amountPaid: data.amountPaid,
        paymentDate: data.paymentDate,
        remarks: data.remarks,
      })
      setSelectedIds((prev) => prev.filter((id) => id !== payTargetEntry.id))
      setIsPayOpen(false)
      setPayTargetEntry(null)
    }
  }

  const handleConfirmBulkPay = async (data: {
    rtgsReference: string
    paymentDate: string
    entryIds: string[]
  }) => {
    await bulkMarkAsPaid(data.entryIds, data.rtgsReference, data.paymentDate)
    setSelectedIds([])
    setIsBulkPayOpen(false)
  }

  // Exports
  const handleExportExcel = () => {
    const config = getPendingRTGSExcelConfig(filteredEntries)
    exportToExcel(config)
    setIsExportMenuOpen(false)
  }

  const handleExportPDF = () => {
    const config = getPendingRTGSPDFConfig(filteredEntries)
    exportToPDF(config)
    setIsExportMenuOpen(false)
  }

  // Refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastUpdated(new Date())
      setIsRefreshing(false)
    }, 350)
  }

  const isAllSelected =
    filteredEntries.length > 0 && selectedIds.length === filteredEntries.length

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 font-sans text-[#111827]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* SECTION 1: UNIFIED HEADER & COMMAND BAR */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Left: View Title + Live Pulsating Amber Beacon + Inline Active Count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <span className="relative flex h-3 w-3 items-center justify-center mr-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#111827]">
                Pending RTGS Settlements
              </h1>
            </div>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono bg-amber-50 text-amber-900 border border-amber-200/80">
              {basePendingEntries.length} {basePendingEntries.length === 1 ? 'item' : 'items'} awaiting transfer
            </span>
          </div>

          {/* Center: Quick Filter Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search party, lorry, bill..."
              className="w-full h-9 pl-9 pr-8 bg-white border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-black/15 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: Action Grouping (Timestamp + Export Dropdown + Quick Refresh) */}
          <div className="flex items-center justify-end gap-2.5 shrink-0">
            {/* Timestamp Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-full text-[11px] font-mono text-[#4B5563]">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>
                As of{' '}
                {formatISTDateTime(lastUpdated)}
              </span>
            </div>

            {/* Export Schedule Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                className="h-9 px-3.5 bg-white hover:bg-slate-50 text-[#111827] border border-[#E5E7EB] text-xs font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <span>Export Schedule</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg p-1 z-30 animate-in fade-in zoom-in-95 duration-150 text-xs">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-[#111827] rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Export as Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-[#111827] rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>Export as PDF (.pdf)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className="h-9 w-9 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#111827] border border-[#E5E7EB] rounded-lg shadow-2xs flex items-center justify-center transition-colors"
              title="Refresh settlement schedule"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* SECTION 2: TREASURY AGING & LIABILITY BENTO */}
        <PendingKPICards summary={kpiSummary} />

        {/* SECTION 3: SEGMENTED RISK TABS & MULTI-FILTER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          {/* Left: Segmented Tabs */}
          <PendingTabBar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab)
              setSelectedIds([])
            }}
            counts={tabCounts}
          />

          {/* Right: Quality Grade & Aging Filter Bar */}
          <PendingFilterRow
            qualityFilter={qualityFilter}
            onQualityChange={setQualityFilter}
            agedFilter={agedFilter}
            onAgedChange={setAgedFilter}
            qualities={masterQualities}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            filteredCount={filteredEntries.length}
            selectedCount={selectedIds.length}
            onToggleSelectAll={handleToggleSelectAll}
            isAllSelected={isAllSelected}
          />
        </div>

        {/* SECTION 4: HIGH-DENSITY RTGS LEDGER TABLE */}
        <PendingTable
          data={filteredEntries}
          selectedIds={selectedIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectRow={handleToggleSelectRow}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMarkAsPaid={handlePayClick}
          isFiltered={hasActiveFilters || activeTab !== 'all'}
          onResetFilters={handleResetFilters}
          onViewAllBills={() => navigate('/billing')}
          onAddBill={() => navigate('/billing/add')}
        />

        {/* SECTION 5: FLOATING SETTLEMENT ACTION DOCK */}
        <PendingBulkBar
          selectedCount={selectedIds.length}
          totalAmount={totalSelectedAmount}
          selectedMT={totalSelectedMT}
          onClearSelection={handleClearSelection}
          onMarkBulkPaid={() => setIsBulkPayOpen(true)}
        />

        {/* DETAIL MODAL */}
        <BillDetailModal
          open={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          entry={selectedEntry}
          onEdit={handleEdit}
          onMarkAsPaid={handlePayClick}
        />

        {/* SINGLE PAYMENT MODAL */}
        <MarkAsPaidModal
          open={isPayOpen}
          onClose={() => {
            setIsPayOpen(false)
            setPayTargetEntry(null)
          }}
          entry={payTargetEntry}
          onConfirm={handleConfirmSinglePay}
        />

        {/* BULK PAYMENT MODAL */}
        <MarkAsPaidModal
          open={isBulkPayOpen}
          onClose={() => setIsBulkPayOpen(false)}
          bulkEntries={selectedEntries}
          onConfirm={async (data) => {
            await handleConfirmBulkPay({
              rtgsReference: data.rtgsReference,
              paymentDate: data.paymentDate,
              entryIds: data.entryIds,
            })
          }}
        />

        {/* DELETE CONFIRM DIALOG */}
        <DeleteConfirmDialog
          open={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false)
            setDeleteEntry(null)
          }}
          itemName={
            deleteEntry?.bill_number
              ? `Bill #${deleteEntry.bill_number}`
              : 'this bill entry'
          }
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  )
}
