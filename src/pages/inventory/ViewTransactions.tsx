import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ClipboardList,
  Plus,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FileCode,
  Printer,
  Download,
} from 'lucide-react'
import { TransactionFilters } from '@components/inventory/TransactionFilters'
import { SummaryBar } from '@components/inventory/SummaryBar'
import { TransactionTable } from '@components/inventory/TransactionTable'
import { TransactionDetailModal } from '@components/inventory/TransactionDetailModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import { useInventory, type TransactionFilters as FilterType } from '@hooks/useInventory'
import { exportToExcel } from '@lib/exportExcel'
import { exportToPDF } from '@lib/exportPDF'
import { exportToCSV } from '@lib/exportCSV'
import {
  getTransactionsExcelConfig,
  getTransactionsPDFConfig,
  prepareTransactionExportRows,
} from '@lib/reportConfigs'
import type { InventoryTransaction } from '@types'

export function ViewTransactions() {
  const {
    transactions,
    isLoading,
    getFilteredTransactions,
    deleteTransaction,
  } = useInventory()

  const [filters, setFilters] = useState<FilterType>({})
  const [selectedTxn, setSelectedTxn] = useState<InventoryTransaction | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTxn, setDeletingTxn] = useState<InventoryTransaction | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  // Close export dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    if (exportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [exportMenuOpen])

  // Get filtered dataset
  const filteredData = useMemo(() => {
    return getFilteredTransactions(filters)
  }, [getFilteredTransactions, filters, transactions])

  // Summary stats for filtered dataset
  const filteredStats = useMemo(() => {
    const totalCount = filteredData.length
    const totalInward = filteredData.reduce((sum, t) => sum + (t.inward_weight || 0), 0)
    const totalGodown = filteredData.reduce((sum, t) => sum + (t.godown_weight || 0), 0)
    const totalVariance = filteredData.reduce((sum, t) => sum + (t.weight_variance || 0), 0)
    const totalOutward = filteredData.reduce((sum, t) => sum + (t.outward_weight || 0), 0)
    const netStock = filteredData.reduce((sum, t) => sum + (t.net_stock || 0), 0)

    return {
      totalCount,
      totalInward: Math.round(totalInward * 1000) / 1000,
      totalGodown: Math.round(totalGodown * 1000) / 1000,
      totalVariance: Math.round(totalVariance * 1000) / 1000,
      totalOutward: Math.round(totalOutward * 1000) / 1000,
      netStock: Math.round(netStock * 1000) / 1000,
    }
  }, [filteredData])

  const handleOpenDetail = (txn: InventoryTransaction) => {
    setSelectedTxn(txn)
    setDetailModalOpen(true)
  }

  const handleOpenDelete = (txn: InventoryTransaction) => {
    setDeletingTxn(txn)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingTxn) return
    setIsDeleting(true)
    try {
      await deleteTransaction(deletingTxn.id)
      setDeleteDialogOpen(false)
      setDeletingTxn(null)
      toast.success('Transaction deleted successfully')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = (type: 'Excel' | 'PDF' | 'CSV' | 'Print') => {
    setExportMenuOpen(false)

    if (type === 'Print') {
      window.print()
      return
    }

    if (filteredData.length === 0) {
      toast.warning('No matching transaction records to export')
      return
    }

    if (type === 'Excel') {
      exportToExcel(getTransactionsExcelConfig(filteredData, filteredStats))
    } else if (type === 'PDF') {
      exportToPDF(getTransactionsPDFConfig(filteredData, filteredStats))
    } else if (type === 'CSV') {
      exportToCSV(prepareTransactionExportRows(filteredData), 'Inventory_Transactions')
    }
  }

  return (
    <div className="space-y-5 select-none">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: COMPACT PAGE HEADER
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-400" />
            <span>Inventory Transactions</span>
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Inward / outward weighbridge history
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              type="button"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 w-48 flex flex-col space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => handleExport('Excel')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition cursor-pointer text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Export to Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('PDF')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-rose-700 transition cursor-pointer text-left"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Export to PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('CSV')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition cursor-pointer text-left"
                >
                  <FileCode className="w-4 h-4 text-blue-600" />
                  <span>Export to CSV</span>
                </button>
                <div className="border-t border-slate-100 my-0.5" />
                <button
                  type="button"
                  onClick={() => handleExport('Print')}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer text-left"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Print View</span>
                </button>
              </div>
            )}
          </div>

          {/* Add Transaction Button */}
          <Link
            to="/inventory/add"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: 2-LAYER FILTER BAR
          ───────────────────────────────────────────────────────────── */}
      <TransactionFilters
        filters={filters}
        onFilterChange={setFilters}
        onReset={() => setFilters({})}
        totalResultsCount={filteredData.length}
      />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: SUMMARY STAT CARDS (5 Horizontal Cards)
          ───────────────────────────────────────────────────────────── */}
      <SummaryBar
        totalCount={filteredStats.totalCount}
        totalInward={filteredStats.totalInward}
        totalGodown={filteredStats.totalGodown}
        totalVariance={filteredStats.totalVariance}
        totalOutward={filteredStats.totalOutward}
        netStock={filteredStats.netStock}
      />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: REDESIGNED TANSTACK DATA TABLE
          ───────────────────────────────────────────────────────────── */}
      <TransactionTable
        data={filteredData}
        isLoading={isLoading}
        totalFilteredCount={transactions.length}
        onViewDetail={handleOpenDetail}
        onDeleteTxn={handleOpenDelete}
        onResetFilters={() => setFilters({})}
      />

      {/* ─────────────────────────────────────────────────────────────
          SECTION 8: SLIDE-IN TRANSACTION DETAIL DRAWER
          ───────────────────────────────────────────────────────────── */}
      <TransactionDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        transaction={selectedTxn}
        onDelete={handleOpenDelete}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingTxn?.bill_number || 'Transaction'}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default ViewTransactions
