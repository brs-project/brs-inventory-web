import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  X,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  FileCode,
  Printer,
} from 'lucide-react'
import { DispatchFilters } from '@components/dispatch/DispatchFilters'
import { DispatchSummaryBar } from '@components/dispatch/DispatchSummaryBar'
import { DispatchTable } from '@components/dispatch/DispatchTable'
import { DispatchDetailModal } from '@components/dispatch/DispatchDetailModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import { useDispatch } from '@hooks/useDispatch'
import { exportToExcel } from '@lib/exportExcel'
import { exportToPDF } from '@lib/exportPDF'
import { exportToCSV } from '@lib/exportCSV'
import {
  getDispatchExcelConfig,
  getDispatchPDFConfig,
  getDispatchCSVData,
} from '@lib/reportConfigs'
import type { DispatchEntry, DispatchFilters as FilterType } from '@types'

export function ViewDispatches() {
  const {
    dispatches,
    isLoading,
    getDispatches,
    deleteDispatch,
  } = useDispatch()

  const [filters, setFilters] = useState<FilterType>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchEntry | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingDispatch, setDeletingDispatch] = useState<DispatchEntry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus spotlight search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  // Base filtered dataset from filter criteria
  const baseFilteredData = useMemo(() => {
    return getDispatches(filters)
  }, [getDispatches, filters])

  // Live status counts calculated from current base filters (excluding status)
  const statusCounts = useMemo(() => {
    const filtersWithoutStatus = { ...filters, status: undefined }
    const set = getDispatches(filtersWithoutStatus)
    const all = set.length
    const dispatched = set.filter((d) => d.status === 'dispatched').length
    const draft = set.filter((d) => d.status === 'draft').length
    const cancelled = set.filter((d) => d.status === 'cancelled').length
    return { all, dispatched, draft, cancelled }
  }, [getDispatches, filters])

  // Spotlight search filter applied over base filtered dataset
  const finalFilteredData = useMemo(() => {
    if (!searchQuery.trim()) return baseFilteredData
    const q = searchQuery.toLowerCase().trim()
    const qClean = q.replace(/\s+/g, '')

    return baseFilteredData.filter((d) => {
      const dbNo = (d.dispatch_bill_number || '').toLowerCase()
      const lorry = (d.lorry_number || '').toLowerCase().replace(/\s+/g, '')
      const party = (d.parties?.party_name || d.party_id || '').toLowerCase()
      const partyCode = (d.parties?.party_code || '').toLowerCase()
      const transporter = (d.transporter || '').toLowerCase()
      const billNo = (d.bill_number || '').toLowerCase()
      const quality = (d.qualities?.quality_name || d.quality_id || '').toLowerCase()

      return (
        dbNo.includes(q) ||
        lorry.includes(qClean) ||
        party.includes(q) ||
        partyCode.includes(q) ||
        transporter.includes(q) ||
        billNo.includes(q) ||
        quality.includes(q)
      )
    })
  }, [baseFilteredData, searchQuery])

  // Summary stats calculated from filtered data
  const summary = useMemo(() => {
    const totalDispatches = finalFilteredData.length
    const totalBillWeight = Number(
      finalFilteredData.reduce((sum, d) => sum + (d.bill_weight || 0), 0).toFixed(3)
    )

    const partySet = new Set<string>()
    const lorrySet = new Set<string>()
    const transporterSet = new Set<string>()

    for (const d of finalFilteredData) {
      if (d.party_id) partySet.add(d.party_id)
      if (d.parties?.party_name) partySet.add(d.parties.party_name)
      if (d.lorry_number) lorrySet.add(d.lorry_number.toUpperCase().trim())
      if (d.transporter) transporterSet.add(d.transporter.trim())
    }

    return {
      totalDispatches,
      totalBillWeight,
      uniqueParties: partySet.size,
      uniqueLorries: lorrySet.size,
      uniqueTransporters: transporterSet.size,
    }
  }, [finalFilteredData])

  const handleOpenDetail = (item: DispatchEntry) => {
    setSelectedDispatch(item)
    setDetailModalOpen(true)
  }

  const handleOpenDelete = (item: DispatchEntry) => {
    setDeletingDispatch(item)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingDispatch) return
    setIsDeleting(true)
    try {
      await deleteDispatch(deletingDispatch.id)
      setDeleteDialogOpen(false)
      setDeletingDispatch(null)
    } catch {
      // Handled in hook
    } finally {
      setIsDeleting(false)
    }
  }

  // Export handlers
  const handleExportExcel = () => {
    setExportMenuOpen(false)
    const config = getDispatchExcelConfig(finalFilteredData, summary, filters)
    exportToExcel(config)
  }

  const handleExportPDF = () => {
    setExportMenuOpen(false)
    const config = getDispatchPDFConfig(finalFilteredData, summary, filters)
    exportToPDF(config)
  }

  const handleExportCSV = () => {
    setExportMenuOpen(false)
    const { headers, data, filename } = getDispatchCSVData(finalFilteredData)
    exportToCSV(data, filename, headers)
  }

  const handlePrint = () => {
    setExportMenuOpen(false)
    window.print()
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-20 select-none font-sans text-[#111827]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Print-only header */}
        <div className="hidden print:block mb-4 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            DISPATCH SHEET — BRS METALS ENTERPRISE
          </h1>
          <p className="text-xs text-slate-500">
            Outward Dispatch Register &amp; Weighment Log
          </p>
        </div>

        {/* SECTION 1: COMMAND-BAR STYLE HEADER */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 print:hidden">
          {/* Left: View Title + Live Status Dot + Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <span className="relative flex h-2.5 w-2.5 items-center justify-center mr-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#111827]">
                Dispatch Sheet &amp; Outward Ledger
              </h1>
            </div>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono bg-emerald-50 text-emerald-900 border border-emerald-200/80">
              {finalFilteredData.length} active dispatches
            </span>
          </div>

          {/* Center: Spotlight Search Input with ⌘K keycap */}
          <div className="relative w-full md:w-80 lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by DB no, lorry plate, party, transporter..."
              className="w-full h-10 pl-9 pr-14 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#111827] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-zinc-900 shadow-xs transition-all"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>

          {/* Right Action Group (Export Register Dropdown + New Dispatch Button) */}
          <div className="flex items-center justify-end gap-2.5 shrink-0">
            {/* Export Register Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="h-10 px-3.5 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-[#111827] text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Export Register</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {exportMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-[#E5E7EB] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-[#111827] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Export to Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-[#111827] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-rose-600" />
                    <span>Export to PDF (.pdf)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-[#111827] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileCode className="h-4 w-4 text-sky-600" />
                    <span>Export to CSV (.csv)</span>
                  </button>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-[#111827] rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-slate-600" />
                    <span>Print Dispatch Sheet</span>
                  </button>
                </div>
              )}
            </div>

            {/* Add New Dispatch Button */}
            <Link
              to="/dispatch/add"
              className="h-10 px-4 rounded-xl bg-[#111827] hover:bg-zinc-800 active:bg-black text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ New Dispatch</span>
            </Link>
          </div>
        </div>

        {/* SECTION 2: LOGISTICS BENTO HERO */}
        <div className="print:hidden">
          <DispatchSummaryBar
            summary={summary}
            dispatchedCount={statusCounts.dispatched}
            draftCount={statusCounts.draft}
            cancelledCount={statusCounts.cancelled}
          />
        </div>

        {/* SECTION 3: SEGMENTED STATUS TABS & INLINE FILTER RAIL */}
        <div className="print:hidden">
          <DispatchFilters
            filters={filters}
            onFiltersChange={setFilters}
            totalRecordsCount={dispatches.length}
            filteredCount={finalFilteredData.length}
            statusCounts={statusCounts}
          />
        </div>

        {/* SECTION 4: HIGH-DENSITY DISPATCH LEDGER TABLE */}
        <DispatchTable
          data={finalFilteredData}
          isLoading={isLoading}
          onViewDetail={handleOpenDetail}
          onDeleteDispatch={handleOpenDelete}
        />

        {/* SECTION 5: DISPATCH DETAIL MODAL */}
        <DispatchDetailModal
          open={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          dispatch={selectedDispatch}
        />

        {/* DELETE CONFIRM DIALOG */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletingDispatch(null)
          }}
          onConfirm={handleConfirmDelete}
          itemName={
            deletingDispatch
              ? `Dispatch ${deletingDispatch.dispatch_bill_number} (${deletingDispatch.bill_weight.toFixed(3)} MT)`
              : 'this dispatch'
          }
          isDeleting={isDeleting}
        />
      </div>
    </div>
  )
}

export default ViewDispatches
