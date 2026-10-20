import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CreditCard,
  ChevronDown,
} from 'lucide-react'
import { useBill } from '@hooks/useBill'
import { BillSummaryBar } from '@components/billing/BillSummaryBar'
import { BillFilters } from '@components/billing/BillFilters'
import { BillTable } from '@components/billing/BillTable'
import { BillDetailDrawer } from '@components/billing/BillDetailDrawer'
import { MarkAsPaidModal } from '@components/billing/MarkAsPaidModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import {
  getBillExcelConfig,
  getBillPDFConfig,
  getBillCSVData,
  getPendingRTGSExcelConfig,
} from '@lib/reportConfigs'
import { exportToExcel } from '@lib/exportExcel'
import { exportToPDF } from '@lib/exportPDF'
import { exportToCSV } from '@lib/exportCSV'
import type { BillEntry, BillFilters as BillFiltersType } from '@types'

export function ViewBills() {
  const navigate = useNavigate()
  const {
    getBillEntries,
    getBillSummary,
    deleteBillEntry,
    markAsPaid,
    isLoading,
    entries,
  } = useBill()

  const [filters, setFilters] = useState<BillFiltersType>({})
  const [selectedEntry, setSelectedEntry] = useState<BillEntry | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [payEntry, setPayEntry] = useState<BillEntry | null>(null)
  const [isPayOpen, setIsPayOpen] = useState(false)
  const [deleteEntry, setDeleteEntry] = useState<BillEntry | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  // Filtered dataset & summary
  const filteredData = useMemo(() => {
    return getBillEntries(filters)
  }, [getBillEntries, filters, entries])

  const summary = useMemo(() => {
    return getBillSummary(filters)
  }, [getBillSummary, filters, entries])

  // Active Category helper for bento cards & filter sync
  const activeCategory = useMemo<'all' | 'under' | 'over' | 'exact'>(() => {
    if (!filters.billingType || filters.billingType.length === 0 || filters.billingType.length === 3) {
      return 'all'
    }
    if (filters.billingType.length === 1) {
      return filters.billingType[0]
    }
    return 'all'
  }, [filters.billingType])

  const handleSelectCategory = (category: 'all' | 'under' | 'over' | 'exact') => {
    if (category === 'all') {
      setFilters((prev) => ({ ...prev, billingType: undefined }))
    } else {
      setFilters((prev) => ({ ...prev, billingType: [category] }))
    }
  }

  // Handlers
  const handleView = (entry: BillEntry) => {
    setSelectedEntry(entry)
    setIsDetailOpen(true)
  }

  const handleEdit = (entry: BillEntry) => {
    navigate(`/billing/edit/${entry.id}`)
  }

  const handleDeleteClick = (entry: BillEntry) => {
    setDeleteEntry(entry)
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (deleteEntry) {
      await deleteBillEntry(deleteEntry.id)
      setIsDeleteOpen(false)
      setDeleteEntry(null)
    }
  }

  const handlePayClick = (entry: BillEntry) => {
    setPayEntry(entry)
    setIsPayOpen(true)
  }

  const handleConfirmPay = async (data: {
    rtgsReference: string
    paymentStatus: 'paid' | 'partial'
    amountPaid?: number
    paymentDate: string
    remarks?: string
    entryIds: string[]
  }) => {
    if (payEntry) {
      await markAsPaid(payEntry.id, data.rtgsReference, {
        paymentStatus: data.paymentStatus,
        amountPaid: data.amountPaid,
        paymentDate: data.paymentDate,
        remarks: data.remarks,
      })
    }
  }

  // Export handlers
  const handleExportExcel = () => {
    const config = getBillExcelConfig(filteredData, summary, filters)
    exportToExcel(config)
    setIsExportOpen(false)
  }

  const handleExportPDF = () => {
    const config = getBillPDFConfig(filteredData, summary, filters)
    exportToPDF(config)
    setIsExportOpen(false)
  }

  const handleExportCSV = () => {
    const { data, filename, headers } = getBillCSVData(filteredData)
    exportToCSV(data, filename, headers)
    setIsExportOpen(false)
  }

  const handleExportPendingRTGS = () => {
    const pendingData = filteredData.filter(
      (e) =>
        (e.payment_status === 'pending' || e.payment_status === 'partial') &&
        e.billing_type !== 'exact'
    )
    const config = getPendingRTGSExcelConfig(pendingData)
    exportToExcel(config)
    setIsExportOpen(false)
  }

  const handlePrint = () => {
    window.print()
    setIsExportOpen(false)
  }

  return (
    <div className="space-y-4 pb-12">
      {/* SECTION 1: HEADER — MODERN FINTECH TITLE & ACTIONS */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-[#17181A] tracking-[-0.02em]">
            Bill & Under Billing Ledger
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="h-9 px-3 rounded-xl border border-[#ECECEE] bg-white text-xs text-[#6E7076] hover:text-[#17181A] font-medium flex items-center gap-1.5 hover:border-[#E0E0E3] hover:bg-[#F7F7F8] transition-all shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#A6A8AE]" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-[#A6A8AE] ml-0.5" />
            </button>

            {isExportOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsExportOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-52 bg-white border border-[#ECECEE] rounded-xl shadow-lg z-30 py-1 text-xs divide-y divide-gray-100 animate-in fade-in-50 zoom-in-95">
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="w-full px-3.5 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-left"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Export to Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="w-full px-3.5 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-left"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-500" />
                      <span>Export to PDF (.pdf)</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="w-full px-3.5 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-left"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      <span>Export to CSV (.csv)</span>
                    </button>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={handleExportPendingRTGS}
                      className="w-full px-3.5 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-left"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-orange-500" />
                      <span>Export Pending RTGS</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="w-full px-3.5 py-1.5 flex items-center gap-2 hover:bg-gray-50 text-gray-700 font-medium transition-colors text-left"
                    >
                      <Printer className="w-3.5 h-3.5 text-gray-400" />
                      <span>Print Bill Sheet</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* New Entry Button */}
          <button
            type="button"
            onClick={() => navigate('/billing/add')}
            className="h-9 px-3.5 rounded-xl bg-[#17181A] hover:bg-[#25272B] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: BENTO-GRID KPI SUMMARY */}
      <BillSummaryBar
        summary={summary}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* SECTION 3: COMMAND SEARCH BAR & FILTER RAIL */}
      <BillFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalRecordsCount={entries.length}
        filteredCount={filteredData.length}
        underCount={summary.underBillingCount}
        overCount={summary.overBillingCount}
        exactCount={summary.exactBillingCount}
      />

      {/* SECTION 4: GROUPED LEDGER TABLE & DARK FOOTER */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#ECECEE] p-6 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-lg bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <BillTable
          data={filteredData}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onMarkAsPaid={handlePayClick}
        />
      )}

      {/* SECTION 5: SLIDE-IN DETAIL DRAWER */}
      <BillDetailDrawer
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        entry={selectedEntry}
        onEdit={handleEdit}
        onMarkAsPaid={handlePayClick}
        onDelete={handleDeleteClick}
      />

      {/* SECTION 6: COMPACT MARK AS PAID DIALOG */}
      <MarkAsPaidModal
        open={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        entry={payEntry}
        onConfirm={handleConfirmPay}
      />

      {/* DELETE CONFIRM DIALOG */}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        itemName={deleteEntry?.bill_number ? `Bill ${deleteEntry.bill_number}` : 'this bill entry'}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default ViewBills
