import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  TrendingUp,
  Download,
  Search,
  Building2,
  Layers,
  Calendar,
  Share2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  List,
  FolderTree,
  TableProperties,
  ArrowUpDown,
  Printer,
  CreditCard,
  X,
  AlertTriangle,
  RotateCw,
} from 'lucide-react'
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/services/supabaseClient'
import {
  fetchRateDifferenceDetails,
  recordBillPayment,
  type RateDifferenceDetailRow,
} from '@/services/reportService'
import { exportToCSV } from '@lib/exportCSV'
import { cn } from '@lib/utils'

// Tab definitions
type ReportTab = 'party' | 'item' | 'matrix' | 'sheet'

export function RateDifferenceReport() {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const startOfMonthIST = format(startOfMonth(new Date()), 'yyyy-MM-dd')

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<RateDifferenceDetailRow[]>([])
  const [partiesList, setPartiesList] = useState<{ id: string; name: string; code?: string }[]>([])
  const [itemsList, setItemsList] = useState<string[]>([])

  // Top Filters
  const [activeTab, setActiveTab] = useState<ReportTab>('party')
  const [selectedParty, setSelectedParty] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>(startOfMonthIST)
  const [dateTo, setDateTo] = useState<string>(todayIST)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Party Drill-down accordion state
  const [expandedParties, setExpandedParties] = useState<Record<string, boolean>>({})

  // Sheet View Sorting State
  const [sortField, setSortField] = useState<keyof RateDifferenceDetailRow>('bill_date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Payment Settlement Modal State
  const [paymentModalRow, setPaymentModalRow] = useState<RateDifferenceDetailRow | null>(null)
  const [payAmount, setPayAmount] = useState<number | string>('')
  const [payMode, setPayMode] = useState<string>('Bank Transfer / RTGS')
  const [payRef, setPayRef] = useState<string>('')
  const [isSubmittingPay, setIsSubmittingPay] = useState(false)

  // Fetch report data
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rows, pRes] = await Promise.all([
        fetchRateDifferenceDetails(),
        supabase.from('parties').select('id, name, code').order('name'),
      ])

      setItems(rows)
      if (pRes.data) setPartiesList(pRes.data)

      // Extract unique item names
      const uniqueItems = Array.from(new Set(rows.map((r) => r.item_name).filter(Boolean)))
      setItemsList(uniqueItems)
    } catch (err: any) {
      console.error('Error fetching sauda report:', err)
      toast.error('Failed to load report data from Supabase', {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Quick Date Presets
  const applyDatePreset = (preset: 'today' | 'yesterday' | 'this_week' | 'this_month') => {
    const today = new Date()
    if (preset === 'today') {
      setDateFrom(todayIST)
      setDateTo(todayIST)
    } else if (preset === 'yesterday') {
      const y = format(subDays(today, 1), 'yyyy-MM-dd')
      setDateFrom(y)
      setDateTo(y)
    } else if (preset === 'this_week') {
      setDateFrom(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'))
      setDateTo(todayIST)
    } else if (preset === 'this_month') {
      setDateFrom(startOfMonthIST)
      setDateTo(todayIST)
    }
  }

  // Filtered dataset
  const filteredItems = useMemo(() => {
    return items.filter((row) => {
      // Date range check
      if (dateFrom && row.bill_date < dateFrom) return false
      if (dateTo && row.bill_date > dateTo) return false

      // Party filter
      if (selectedParty !== 'all' && row.party_id !== selectedParty) return false

      // Item filter
      if (selectedItem !== 'all' && row.item_name !== selectedItem) return false

      // Status filter
      if (selectedStatus !== 'all' && row.payment_status !== selectedStatus) return false

      // Free text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match =
          row.party_name.toLowerCase().includes(q) ||
          (row.party_code && row.party_code.toLowerCase().includes(q)) ||
          row.item_name.toLowerCase().includes(q) ||
          (row.lorry_no && row.lorry_no.toLowerCase().includes(q)) ||
          (row.notes && row.notes.toLowerCase().includes(q)) ||
          row.bill_date.includes(q)
        if (!match) return false
      }

      return true
    })
  }, [items, dateFrom, dateTo, selectedParty, selectedItem, selectedStatus, searchQuery])

  // Top 4 Summary KPI Cards
  const kpis = useMemo(() => {
    let totalQty = 0
    let totalPayable = 0
    let totalPaid = 0
    let highDiffCount = 0

    filteredItems.forEach((r) => {
      totalQty += r.qty
      totalPayable += r.total_amount
      totalPaid += r.paid_amount
      if (r.is_high_diff || Math.abs(r.difference) >= 1000) {
        highDiffCount++
      }
    })

    const netBalance = totalPayable - totalPaid
    const weightedAvgDiff = totalQty > 0 ? totalPayable / totalQty : 0

    return {
      totalQty,
      totalPayable,
      totalPaid,
      netBalance,
      weightedAvgDiff,
      highDiffCount,
    }
  }, [filteredItems])

  // Tab 1: Party-wise aggregated groups
  const partyGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        partyId: string
        partyName: string
        partyCode?: string
        partyPhone?: string
        rows: RateDifferenceDetailRow[]
        totalDeals: number
        totalQty: number
        totalPayable: number
        totalPaid: number
        netBalance: number
      }
    >()

    filteredItems.forEach((r) => {
      const pid = r.party_id || r.party_name
      if (!map.has(pid)) {
        map.set(pid, {
          partyId: pid,
          partyName: r.party_name,
          partyCode: r.party_code || undefined,
          partyPhone: r.party_phone || undefined,
          rows: [],
          totalDeals: 0,
          totalQty: 0,
          totalPayable: 0,
          totalPaid: 0,
          netBalance: 0,
        })
      }
      const group = map.get(pid)!
      group.rows.push(r)
      group.totalDeals += 1
      group.totalQty += r.qty
      group.totalPayable += r.total_amount
      group.totalPaid += r.paid_amount
      group.netBalance += r.balance_amount
    })

    return Array.from(map.values()).sort((a, b) => b.netBalance - a.netBalance)
  }, [filteredItems])

  // Tab 2: Item-wise aggregated summary
  const itemSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        itemName: string
        hsnCode: string
        totalDeals: number
        totalQty: number
        sumBillAmount: number
        sumSaudaAmount: number
        totalDiffAmount: number
      }
    >()

    filteredItems.forEach((r) => {
      const key = r.item_name || 'Scrap Material'
      if (!map.has(key)) {
        map.set(key, {
          itemName: key,
          hsnCode: r.hsn_code || '7204',
          totalDeals: 0,
          totalQty: 0,
          sumBillAmount: 0,
          sumSaudaAmount: 0,
          totalDiffAmount: 0,
        })
      }
      const entry = map.get(key)!
      entry.totalDeals += 1
      entry.totalQty += r.qty
      entry.sumBillAmount += r.qty * r.bill_rate
      entry.sumSaudaAmount += r.qty * r.sauda_rate
      entry.totalDiffAmount += r.total_amount
    })

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        avgBillRate: entry.totalQty > 0 ? entry.sumBillAmount / entry.totalQty : 0,
        weightedAvgSaudaRate: entry.totalQty > 0 ? entry.sumSaudaAmount / entry.totalQty : 0,
        weightedAvgDiff: entry.totalQty > 0 ? entry.totalDiffAmount / entry.totalQty : 0,
      }))
      .sort((a, b) => b.totalDiffAmount - a.totalDiffAmount)
  }, [filteredItems])

  // Tab 3: Party x Item Pivot Matrix
  const matrixData = useMemo(() => {
    const distinctItems = Array.from(
      new Set(filteredItems.map((r) => r.item_name || 'Scrap Material'))
    ).sort()

    const partyMap = new Map<
      string,
      {
        partyName: string
        items: Record<string, { payable: number; qty: number }>
        rowTotalPayable: number
        rowTotalQty: number
      }
    >()

    filteredItems.forEach((r) => {
      const pName = r.party_name
      const iName = r.item_name || 'Scrap Material'
      if (!partyMap.has(pName)) {
        partyMap.set(pName, {
          partyName: pName,
          items: {},
          rowTotalPayable: 0,
          rowTotalQty: 0,
        })
      }
      const pRow = partyMap.get(pName)!
      if (!pRow.items[iName]) {
        pRow.items[iName] = { payable: 0, qty: 0 }
      }
      pRow.items[iName].payable += r.total_amount
      pRow.items[iName].qty += r.qty
      pRow.rowTotalPayable += r.total_amount
      pRow.rowTotalQty += r.qty
    })

    // Calculate column totals
    const columnTotals: Record<string, { payable: number; qty: number }> = {}
    let grandPayable = 0
    let grandQty = 0

    distinctItems.forEach((item) => {
      columnTotals[item] = { payable: 0, qty: 0 }
    })

    partyMap.forEach((pRow) => {
      grandPayable += pRow.rowTotalPayable
      grandQty += pRow.rowTotalQty
      distinctItems.forEach((item) => {
        if (pRow.items[item]) {
          columnTotals[item].payable += pRow.items[item].payable
          columnTotals[item].qty += pRow.items[item].qty
        }
      })
    })

    return {
      distinctItems,
      rows: Array.from(partyMap.values()).sort((a, b) => b.rowTotalPayable - a.rowTotalPayable),
      columnTotals,
      grandPayable,
      grandQty,
    }
  }, [filteredItems])

  // Tab 4: Sorted Detailed Sheet Rows
  const sortedSheetRows = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = (bVal || '').toLowerCase()
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredItems, sortField, sortDirection])

  const handleSort = (field: keyof RateDifferenceDetailRow) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Toggle Accordion
  const togglePartyExpand = (partyId: string) => {
    setExpandedParties((prev) => ({
      ...prev,
      [partyId]: !prev[partyId],
    }))
  }

  // Open Payment Modal
  const openPayModal = (item: RateDifferenceDetailRow) => {
    setPaymentModalRow(item)
    setPayAmount(item.balance_amount > 0 ? item.balance_amount : item.total_amount)
    setPayMode('Bank Transfer / RTGS')
    setPayRef('')
  }

  // Submit Payment Settlement
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentModalRow) return

    const amountNum = Number(payAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    setIsSubmittingPay(true)
    try {
      await recordBillPayment(paymentModalRow.bill_id, {
        amountPaidNow: amountNum,
        paymentMode: payMode,
        paymentReference: payRef,
        currentPaid: paymentModalRow.paid_amount,
        totalAmount: paymentModalRow.total_amount,
      })

      toast.success(
        `Payment of ₹${amountNum.toLocaleString('en-IN')} recorded for ${paymentModalRow.party_name}`
      )
      setPaymentModalRow(null)
      loadData()
    } catch (err: any) {
      console.error('Error submitting payment:', err)
      toast.error('Failed to record payment', { description: err.message })
    } finally {
      setIsSubmittingPay(false)
    }
  }

  // Copy WhatsApp Settlement Summary
  const copyWhatsAppStatement = (group: {
    partyName: string
    partyCode?: string
    rows: RateDifferenceDetailRow[]
    totalQty: number
    totalPayable: number
    totalPaid: number
    netBalance: number
  }) => {
    const lines = [
      `📋 *BRS SCRAP YARD — RATE DIFFERENCE STATEMENT*`,
      `🏢 *Party:* ${group.partyName}${group.partyCode ? ` (${group.partyCode})` : ''}`,
      `📅 *Period:* ${dateFrom} to ${dateTo}`,
      `─────────────────────────`,
      `📦 *TRANSACTION BREAKDOWN:*`,
    ]

    group.rows.forEach((r, idx) => {
      lines.push(
        `${idx + 1}. ${r.bill_date} | ${r.item_name}${r.lorry_no ? ` | Lorry: ${r.lorry_no}` : ''}`
      )
      lines.push(
        `   • Qty: ${r.qty.toFixed(3)} MT | Bill: ₹${r.bill_rate} | Sauda: ₹${r.sauda_rate}`
      )
      lines.push(
        `   • Diff: ${r.difference >= 0 ? '+' : ''}₹${r.difference}/unit | Amount: ₹${r.total_amount.toLocaleString('en-IN')}`
      )
      lines.push(
        `   • Paid: ₹${r.paid_amount.toLocaleString('en-IN')} | Balance: ₹${r.balance_amount.toLocaleString('en-IN')} [${r.payment_status.toUpperCase()}]`
      )
    })

    lines.push(`─────────────────────────`)
    lines.push(`⚖️ *Total Tonnage:* ${group.totalQty.toFixed(3)} MT`)
    lines.push(`💰 *Total Payable:* ₹${group.totalPayable.toLocaleString('en-IN')}`)
    lines.push(`💵 *Total Paid:* ₹${group.totalPaid.toLocaleString('en-IN')}`)
    lines.push(`⚠️ *Net Outstanding Balance:* ₹${group.netBalance.toLocaleString('en-IN')}`)
    lines.push(`─────────────────────────`)
    lines.push(`_Computerized statement issued by BRS Steel Mart._`)

    navigator.clipboard.writeText(lines.join('\n')).then(
      () => toast.success(`WhatsApp statement copied for ${group.partyName}`),
      () => toast.error('Failed to copy to clipboard')
    )
  }

  // Print Statement trigger
  const handlePrint = () => {
    window.print()
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      toast.warning('No data to export')
      return
    }

    const exportData = filteredItems.map((r) => ({
      'Bill Date': r.bill_date,
      'Party Name': r.party_name,
      'Party Code': r.party_code || '',
      Item: r.item_name,
      'HSN Code': r.hsn_code || '7204',
      'Lorry No': r.lorry_no || '',
      'Quantity (MT)': r.qty.toFixed(3),
      'Bill Rate (INR)': r.bill_rate,
      'Sauda Rate (INR)': r.sauda_rate,
      'Difference (INR)': r.difference,
      'Total Amount (INR)': r.total_amount,
      'Paid Amount (INR)': r.paid_amount,
      'Balance (INR)': r.balance_amount,
      Status: r.payment_status.toUpperCase(),
      'Payment Mode': r.payment_mode || '',
      'Reference / UTR': r.payment_reference || '',
    }))

    exportToCSV(exportData, `Rate_Difference_Statement_${dateFrom}_to_${dateTo}`)
  }

  return (
    <div className="space-y-6 max-w-full print:p-0">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          nav, aside, header, .no-print { display: none !important; }
          .print-full-width { width: 100% !important; max-width: 100% !important; margin: 0 !important; }
          table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
          th, td { padding: 4px 6px !important; border: 1px solid #e2e8f0 !important; }
          body { background: white !important; font-size: 11px !important; }
        }
      `}</style>

      {/* =========================================================================
          PAGE HEADER & ACTIONS BAR (hidden in print)
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Vendor Payable & Rate Difference Report
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Sauda rate differences, vendor payable ledgers, and settlement tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh database records"
          >
            <RotateCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 transition shadow-2xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-zinc-500" />
            <span>Print Statement</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-2xs transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          ROW 1: 4 TOP KPI SUMMARY CARDS
      ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Quantity */}
        <div className="p-4.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Total Quantity
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
              {kpis.totalQty.toFixed(3)}
            </span>
            <span className="text-xs font-bold text-zinc-500">MT</span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Across {filteredItems.length} settled dispatch deals
          </p>
        </div>

        {/* KPI 2: Total Payable Amount */}
        <div className="p-4.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Total Payable Amount
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
              ₹{kpis.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
            Sum of (Quantity × Rate Difference)
          </p>
        </div>

        {/* KPI 3: Paid vs Net Balance */}
        <div className="p-4.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Paid vs. Net Balance
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{kpis.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-zinc-400">Paid</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-500 font-medium">Remaining Balance:</span>
            <span
              className={cn(
                'font-bold font-mono',
                kpis.netBalance > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-zinc-700 dark:text-zinc-300'
              )}
            >
              ₹{kpis.netBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* KPI 4: Weighted Avg Difference / Unit */}
        <div className="p-4.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Weighted Avg Variance
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
              ₹{kpis.weightedAvgDiff.toFixed(2)}
            </span>
            <span className="text-xs font-bold text-zinc-500">/unit</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {kpis.highDiffCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                <AlertTriangle className="h-3 w-3" />
                {kpis.highDiffCount} High Diff (&gt;= ₹1,000)
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">All differences within normal range</span>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 2: FILTER TOOLBAR (Restricted to max={todayIST})
      ========================================================================= */}
      <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* Party Dropdown */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-zinc-400" />
              <span>Party / Vendor</span>
            </label>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Parties ({partiesList.length})</option>
              {partiesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Item Dropdown */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              <span>Item / Grade</span>
            </label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Items ({itemsList.length})</option>
              {itemsList.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Dropdown */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
              <span>Payment Status</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Only</option>
              <option value="partial">Partial Payment</option>
              <option value="paid">Paid & Settled</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>From Date</span>
            </label>
            <input
              type="date"
              max={todayIST}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>To Date (Max Today IST)</span>
            </label>
            <input
              type="date"
              max={todayIST}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono"
            />
          </div>
        </div>

        {/* Quick Date Presets & Search Input */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider mr-1">
              Quick Dates:
            </span>
            <button
              type="button"
              onClick={() => applyDatePreset('today')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('yesterday')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('this_week')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('this_month')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition"
            >
              This Month
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search party, item, lorry..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: 4 SEGMENTED VIEW TABS
      ========================================================================= */}
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl w-fit border border-zinc-200/80 dark:border-zinc-700/60 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('party')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
            activeTab === 'party'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <FolderTree className="h-3.5 w-3.5" />
          <span>Party Drill-Down</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('item')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
            activeTab === 'item'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Item-Wise Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
            activeTab === 'matrix'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <TableProperties className="h-3.5 w-3.5" />
          <span>Party × Item Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sheet')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
            activeTab === 'sheet'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          )}
        >
          <List className="h-3.5 w-3.5" />
          <span>Detailed Sheet View</span>
        </button>
      </div>

      {/* =========================================================================
          TAB CONTENT AREA
      ========================================================================= */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
          <p className="text-xs font-semibold">Loading statement records from Supabase...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <TrendingUp className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Records Found</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            No transactions match the selected filters or date period.
          </p>
        </div>
      ) : (
        <>
          {/* ===================================================================
              TAB 1: PARTY-WISE DRILL-DOWN (Default)
          =================================================================== */}
          {activeTab === 'party' && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-3 w-10 text-center">#</th>
                      <th className="py-3 px-4">Party Name</th>
                      <th className="py-3 px-3 text-right">Deals</th>
                      <th className="py-3 px-3 text-right">Total Qty (MT)</th>
                      <th className="py-3 px-4 text-right">Total Payable (₹)</th>
                      <th className="py-3 px-4 text-right">Paid (₹)</th>
                      <th className="py-3 px-4 text-right">Net Balance (₹)</th>
                      <th className="py-3 px-4 text-center no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {partyGroups.map((group) => {
                      const isExpanded = !!expandedParties[group.partyId]
                      return (
                        <tr key={group.partyId} className="contents">
                          {/* Master Party Row */}
                          <tr
                            onClick={() => togglePartyExpand(group.partyId)}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors font-medium"
                          >
                            <td className="py-3.5 px-3 text-center">
                              <button
                                type="button"
                                className="p-1 rounded text-zinc-400 hover:text-zinc-700"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                              <div className="flex items-center gap-2">
                                <span>{group.partyName}</span>
                                {group.partyCode && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                                    {group.partyCode}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                              {group.totalDeals}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                              {group.totalQty.toFixed(3)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                              ₹{group.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              ₹{group.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-black">
                              <span
                                className={cn(
                                  group.netBalance > 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-zinc-600 dark:text-zinc-400'
                                )}
                              >
                                ₹{group.netBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td
                              className="py-3.5 px-4 text-center no-print"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => copyWhatsAppStatement(group)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 transition cursor-pointer"
                                  title="Copy clean WhatsApp summary"
                                >
                                  <Share2 className="h-3 w-3" />
                                  <span>WhatsApp</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Inline Sub-Table Accordion */}
                          {isExpanded && (
                            <tr className="bg-zinc-50/70 dark:bg-zinc-800/30">
                              <td colSpan={8} className="p-3 pl-12 pr-4">
                                <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
                                  <table className="w-full text-left text-[11px]">
                                    <thead>
                                      <tr className="bg-zinc-100/70 dark:bg-zinc-800 text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-700">
                                        <th className="py-2 px-3">Date</th>
                                        <th className="py-2 px-3">Item / Scrap Grade</th>
                                        <th className="py-2 px-3">Lorry No</th>
                                        <th className="py-2 px-3 text-right">Qty (MT)</th>
                                        <th className="py-2 px-3 text-right">Bill Rate</th>
                                        <th className="py-2 px-3 text-right">Sauda Rate</th>
                                        <th className="py-2 px-3 text-right">Diff (₹)</th>
                                        <th className="py-2 px-3 text-right">Total Amount (₹)</th>
                                        <th className="py-2 px-3 text-center">Status</th>
                                        <th className="py-2 px-3 text-center no-print">Action</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                      {group.rows.map((row) => (
                                        <tr
                                          key={row.bill_id}
                                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors"
                                        >
                                          <td className="py-2 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                                            {row.bill_date}
                                          </td>
                                          <td className="py-2 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                            {row.item_name}
                                          </td>
                                          <td className="py-2 px-3 font-mono text-zinc-500">
                                            {row.lorry_no || '-'}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-bold">
                                            {row.qty.toFixed(3)}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono text-zinc-600">
                                            ₹{row.bill_rate.toFixed(2)}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                            ₹{row.sauda_rate.toFixed(2)}
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-bold">
                                            <span
                                              className={cn(
                                                'px-1.5 py-0.5 rounded text-[10px]',
                                                row.is_high_diff || Math.abs(row.difference) >= 1000
                                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 border border-rose-200'
                                                  : row.difference < 0
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'text-zinc-900 dark:text-zinc-100'
                                              )}
                                            >
                                              {row.difference >= 0 ? '+' : ''}₹{row.difference.toFixed(2)}
                                              {(row.is_high_diff || Math.abs(row.difference) >= 1000) && ' ⚠️'}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                                            ₹{row.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                          </td>
                                          <td className="py-2 px-3 text-center">
                                            <span
                                              className={cn(
                                                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                                                row.payment_status === 'paid'
                                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                                                  : row.payment_status === 'partial'
                                                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200'
                                              )}
                                            >
                                              {row.payment_status}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 text-center no-print">
                                            {row.payment_status !== 'paid' ? (
                                              <button
                                                type="button"
                                                onClick={() => openPayModal(row)}
                                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition cursor-pointer shadow-2xs"
                                              >
                                                Pay / Settle
                                              </button>
                                            ) : (
                                              <span className="text-emerald-600 font-bold text-[10px] flex items-center justify-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Settled
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Sticky Grand Totals Row */}
                  <tfoot>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/80 font-black border-t-2 border-zinc-300 dark:border-zinc-700">
                      <td colSpan={2} className="py-3 px-4 uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Grand Totals ({partyGroups.length} Parties)
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{filteredItems.length}</td>
                      <td className="py-3 px-3 text-right font-mono">{kpis.totalQty.toFixed(3)}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                        ₹{kpis.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        ₹{kpis.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                        ₹{kpis.netBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="no-print"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 2: ITEM-WISE SUMMARY
          =================================================================== */}
          {activeTab === 'item' && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Item Name / Scrap Grade</th>
                      <th className="py-3 px-3 text-center">HSN Code</th>
                      <th className="py-3 px-3 text-right">Deals</th>
                      <th className="py-3 px-4 text-right">Total Qty (MT)</th>
                      <th className="py-3 px-4 text-right">Avg Bill Rate (₹)</th>
                      <th className="py-3 px-4 text-right">Wtd Avg Sauda Rate (₹)</th>
                      <th className="py-3 px-4 text-right">Wtd Avg Diff (₹/MT)</th>
                      <th className="py-3 px-4 text-right">Total Diff Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {itemSummaries.map((item) => (
                      <tr
                        key={item.itemName}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                          {item.itemName}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-zinc-500">
                          {item.hsnCode}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-zinc-600 dark:text-zinc-400">
                          {item.totalDeals}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {item.totalQty.toFixed(3)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-zinc-600">
                          ₹{item.avgBillRate.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          ₹{item.weightedAvgSaudaRate.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[11px]',
                              Math.abs(item.weightedAvgDiff) >= 1000
                                ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                                : 'text-zinc-900 dark:text-zinc-100'
                            )}
                          >
                            ₹{item.weightedAvgDiff.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-blue-600 dark:text-blue-400">
                          ₹{item.totalDiffAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/80 font-black border-t-2 border-zinc-300 dark:border-zinc-700">
                      <td colSpan={2} className="py-3 px-4 uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Total Across All Items
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{filteredItems.length}</td>
                      <td className="py-3 px-4 text-right font-mono">{kpis.totalQty.toFixed(3)}</td>
                      <td colSpan={2}></td>
                      <td className="py-3 px-4 text-right font-mono">
                        ₹{kpis.weightedAvgDiff.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-600 dark:text-blue-400">
                        ₹{kpis.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 3: PARTY × ITEM MATRIX (Pivot View)
          =================================================================== */}
          {activeTab === 'matrix' && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 sticky left-0 bg-zinc-50 dark:bg-zinc-800 z-10 border-r border-zinc-200 dark:border-zinc-700">
                        Party Name
                      </th>
                      {matrixData.distinctItems.map((item) => (
                        <th key={item} className="py-3 px-4 text-right min-w-[130px]">
                          {item}
                        </th>
                      ))}
                      <th className="py-3 px-4 text-right font-black bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-l border-zinc-200 dark:border-zinc-700 min-w-[140px]">
                        Row Total Payable (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {matrixData.rows.map((pRow) => (
                      <tr
                        key={pRow.partyName}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100 sticky left-0 bg-white dark:bg-zinc-900 z-10 border-r border-zinc-200 dark:border-zinc-700">
                          {pRow.partyName}
                        </td>
                        {matrixData.distinctItems.map((item) => {
                          const cell = pRow.items[item]
                          return (
                            <td key={item} className="py-3 px-4 text-right font-mono">
                              {cell ? (
                                <div>
                                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                    ₹{cell.payable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                  </span>
                                  <div className="text-[10px] text-zinc-400 font-medium">
                                    {cell.qty.toFixed(3)} MT
                                  </div>
                                </div>
                              ) : (
                                <span className="text-zinc-300 dark:text-zinc-700">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="py-3 px-4 text-right font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/10 border-l border-zinc-200 dark:border-zinc-700">
                          <div>
                            <span>₹{pRow.rowTotalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                            <div className="text-[10px] text-blue-500 font-semibold">
                              {pRow.rowTotalQty.toFixed(3)} MT
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Matrix Grand Column Totals Footer */}
                  <tfoot>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/80 font-black border-t-2 border-zinc-300 dark:border-zinc-700">
                      <td className="py-3 px-4 uppercase tracking-wider text-zinc-900 dark:text-zinc-100 sticky left-0 bg-zinc-100 dark:bg-zinc-800 z-10 border-r border-zinc-200 dark:border-zinc-700">
                        Column Totals
                      </td>
                      {matrixData.distinctItems.map((item) => {
                        const col = matrixData.columnTotals[item]
                        return (
                          <td key={item} className="py-3 px-4 text-right font-mono">
                            <div>
                              <span>₹{col.payable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                              <div className="text-[10px] text-zinc-500">{col.qty.toFixed(3)} MT</div>
                            </div>
                          </td>
                        )
                      })}
                      <td className="py-3 px-4 text-right font-mono font-black text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-950/40 border-l border-zinc-200 dark:border-zinc-700">
                        <div>
                          <span>₹{matrixData.grandPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                          <div className="text-[10px] text-blue-600 font-bold">
                            {matrixData.grandQty.toFixed(3)} MT
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 4: DETAILED SHEET VIEW (Excel Table)
          =================================================================== */}
          {activeTab === 'sheet' && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                      <th
                        onClick={() => handleSort('bill_date')}
                        className="py-3 px-3 cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center gap-1">
                          <span>Date</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('party_name')}
                        className="py-3 px-3 cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center gap-1">
                          <span>Party Name</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('item_name')}
                        className="py-3 px-3 cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center gap-1">
                          <span>Item</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('qty')}
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Qty</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('bill_rate')}
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Bill Rate</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('sauda_rate')}
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Sauda Rate</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('difference')}
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Difference</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('total_amount')}
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Total Amount</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('paid_amount')}
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Paid</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('balance_amount')}
                        className="py-3 px-3 text-right cursor-pointer select-none hover:text-zinc-900"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Balance</span>
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-3 text-center no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                    {sortedSheetRows.map((row) => (
                      <tr
                        key={row.bill_id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono text-zinc-500 whitespace-nowrap">
                          {row.bill_date}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {row.party_name}
                        </td>
                        <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {row.item_name}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {row.qty.toFixed(3)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-600">
                          ₹{row.bill_rate.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{row.sauda_rate.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold',
                              row.is_high_diff || Math.abs(row.difference) >= 1000
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 border border-rose-200'
                                : row.difference < 0
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-zinc-900 dark:text-zinc-100'
                            )}
                          >
                            {row.difference >= 0 ? '+' : ''}₹{row.difference.toFixed(2)}
                            {(row.is_high_diff || Math.abs(row.difference) >= 1000) && ' ⚠️ High Diff'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          ₹{row.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-bold">
                          ₹{row.paid_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                          ₹{row.balance_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                              row.payment_status === 'paid'
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200'
                                : row.payment_status === 'partial'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200'
                            )}
                          >
                            {row.payment_status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center no-print">
                          {row.payment_status !== 'paid' ? (
                            <button
                              type="button"
                              onClick={() => openPayModal(row)}
                              className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition cursor-pointer"
                            >
                              Pay
                            </button>
                          ) : (
                            <span className="text-emerald-600 text-[10px] font-bold">Paid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Sticky Footer Totals */}
                  <tfoot>
                    <tr className="bg-zinc-100 dark:bg-zinc-800/80 font-black border-t-2 border-zinc-300 dark:border-zinc-700">
                      <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        Total ({sortedSheetRows.length} Deals)
                      </td>
                      <td className="py-3 px-3 text-right font-mono">{kpis.totalQty.toFixed(3)}</td>
                      <td colSpan={3}></td>
                      <td className="py-3 px-3 text-right font-mono text-blue-600 dark:text-blue-400">
                        ₹{kpis.totalPayable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        ₹{kpis.totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        ₹{kpis.netBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2} className="no-print"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          INLINE "RECORD PAYMENT / SETTLE" MODAL
      ========================================================================= */}
      {paymentModalRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Record Payment Settlement
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Update settlement status in Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalRow(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              {/* Summary Banner */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Party:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {paymentModalRow.party_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Item / Grade:</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {paymentModalRow.item_name} ({paymentModalRow.qty.toFixed(3)} MT)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Total Payable:</span>
                  <span className="font-mono font-bold text-blue-600">
                    ₹{paymentModalRow.total_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-zinc-500 font-bold">Outstanding Balance:</span>
                  <span className="font-mono font-black text-rose-600">
                    ₹{paymentModalRow.balance_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Amount Paying Now */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Amount Paying Now (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Payment Mode <span className="text-rose-500">*</span>
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bank Transfer / RTGS">Bank Transfer / RTGS</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              {/* Reference / UTR No */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Reference / UTR / Cheque No.
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UTR123456789 or Cheque #004521"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setPaymentModalRow(null)}
                  disabled={isSubmittingPay}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPay ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Confirm Settlement</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RateDifferenceReport
