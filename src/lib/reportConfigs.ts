import { format } from 'date-fns'
import type { ExcelExportConfig } from './exportExcel'
import type { PDFExportConfig } from './exportPDF'
import type {
  DailyReportFilters,
  DailyReportSummary,
  StockReportFilters,
  StockReportSummary,
  QualityStockRow,
  PartyReportFilters,
  PartyReportSummary,
  PartyReportRow,
  VehicleReportFilters,
  VehicleReportSummary,
  VehicleReportRow,
} from '@hooks/useReports'
import type {
  InventoryTransaction,
  DispatchEntry,
  DispatchFilters,
  DispatchSummary,
  BillEntry,
  BillFilters,
  BillSummary,
} from '@types'

// ---------------------------------------------------------------------------
// 1. TRANSACTIONS LIST & DAILY REPORT EXPORT CONFIGS
// ---------------------------------------------------------------------------

export function prepareTransactionExportRows(transactions: InventoryTransaction[]) {
  return transactions.map((t) => ({
    date: format(new Date(t.transaction_date), 'dd/MM/yyyy'),
    party_name: t.parties?.party_name || '—',
    party_code: t.parties?.party_code || '—',
    quality_name: t.qualities?.quality_name || '—',
    quality_category: t.qualities?.category || 'Scrap',
    bill_number: t.bill_number || '—',
    lorry_in: t.vehicles_in?.lorry_number || t.vehicle_in_id || '—',
    inward_weight: t.inward_weight || 0,
    godown_weight: t.godown_weight || 0,
    variance: t.weight_variance || 0,
    godown_name: t.godowns?.godown_name || '—',
    lorry_out: t.vehicles_out?.lorry_number || t.vehicle_out_id || '—',
    outward_weight: t.outward_weight || 0,
    net_stock: t.net_stock || 0,
    remarks: t.remarks || '—',
    status: t.status.toUpperCase(),
  }))
}

export function getTransactionsExcelConfig(
  transactions: InventoryTransaction[],
  summary?: { totalInward: number; totalOutward: number; totalVariance: number; netStock: number }
): ExcelExportConfig {
  const data = prepareTransactionExportRows(transactions)

  const totalIn = summary?.totalInward ?? transactions.reduce((s, t) => s + (t.inward_weight || 0), 0)
  const totalOut = summary?.totalOutward ?? transactions.reduce((s, t) => s + (t.outward_weight || 0), 0)
  const totalVar = summary?.totalVariance ?? transactions.reduce((s, t) => s + (t.weight_variance || 0), 0)
  const totalNet = summary?.netStock ?? transactions.reduce((s, t) => s + (t.net_stock || 0), 0)

  return {
    filename: 'Inventory_Transactions_Report',
    sheetName: 'Transactions',
    title: 'Inventory Transactions Ledger',
    subtitle: `Total Consignments: ${transactions.length}`,
    headers: [
      { key: 'date', label: 'Date', width: 12 },
      { key: 'party_name', label: 'Party Name', width: 22 },
      { key: 'quality_name', label: 'Quality', width: 15 },
      { key: 'bill_number', label: 'Bill No', width: 14 },
      { key: 'lorry_in', label: 'Lorry In', width: 14 },
      { key: 'inward_weight', label: 'Inward (MT)', width: 13, type: 'weight' },
      { key: 'godown_weight', label: 'Godown (MT)', width: 13, type: 'weight' },
      { key: 'variance', label: 'Variance (MT)', width: 13, type: 'weight' },
      { key: 'godown_name', label: 'Godown Bay', width: 16 },
      { key: 'lorry_out', label: 'Lorry Out', width: 14 },
      { key: 'outward_weight', label: 'Outward (MT)', width: 13, type: 'weight' },
      { key: 'net_stock', label: 'Net Stock (MT)', width: 14, type: 'weight' },
      { key: 'status', label: 'Status', width: 12 },
      { key: 'remarks', label: 'Remarks', width: 24 },
    ],
    summaryData: [
      { label: 'Total Records', value: `${transactions.length}` },
      { label: 'Total Inward', value: `${totalIn.toFixed(3)} MT` },
      { label: 'Total Outward', value: `${totalOut.toFixed(3)} MT` },
      { label: 'Total Variance', value: `${totalVar.toFixed(3)} MT` },
      { label: 'Net Stock Position', value: `${totalNet.toFixed(3)} MT` },
    ],
    totalsRow: {
      inward_weight: totalIn,
      godown_weight: totalIn - totalVar,
      variance: totalVar,
      outward_weight: totalOut,
      net_stock: totalNet,
    },
    data,
  }
}

export function getTransactionsPDFConfig(
  transactions: InventoryTransaction[],
  summary?: { totalInward: number; totalOutward: number; totalVariance: number; netStock: number },
  filterDescription?: string
): PDFExportConfig {
  const data = prepareTransactionExportRows(transactions)

  const totalIn = summary?.totalInward ?? transactions.reduce((s, t) => s + (t.inward_weight || 0), 0)
  const totalOut = summary?.totalOutward ?? transactions.reduce((s, t) => s + (t.outward_weight || 0), 0)
  const totalVar = summary?.totalVariance ?? transactions.reduce((s, t) => s + (t.weight_variance || 0), 0)
  const totalNet = summary?.netStock ?? transactions.reduce((s, t) => s + (t.net_stock || 0), 0)

  return {
    filename: 'Inventory_Transactions_Report',
    reportTitle: 'Inventory Transactions & Weighbridge Log',
    filterDescription: filterDescription || `Displaying ${transactions.length} transactions`,
    orientation: 'landscape',
    columns: [
      { header: 'Date', dataKey: 'date', width: 18 },
      { header: 'Party', dataKey: 'party_name', width: 34 },
      { header: 'Quality', dataKey: 'quality_name', width: 22 },
      { header: 'Bill No', dataKey: 'bill_number', width: 22 },
      { header: 'Lorry In', dataKey: 'lorry_in', width: 22 },
      { header: 'Inward (MT)', dataKey: 'inward_weight', width: 20, type: 'weight', align: 'right' },
      { header: 'Godown (MT)', dataKey: 'godown_weight', width: 20, type: 'weight', align: 'right' },
      { header: 'Var (MT)', dataKey: 'variance', width: 18, type: 'weight', align: 'right' },
      { header: 'Lorry Out', dataKey: 'lorry_out', width: 22 },
      { header: 'Outward (MT)', dataKey: 'outward_weight', width: 20, type: 'weight', align: 'right' },
      { header: 'Net Stock', dataKey: 'net_stock', width: 20, type: 'weight', align: 'right' },
      { header: 'Status', dataKey: 'status', width: 16, align: 'center' },
    ],
    summaryItems: [
      { label: 'Total Records', value: `${transactions.length}` },
      { label: 'Total Inward', value: `${totalIn.toFixed(3)} MT` },
      { label: 'Total Outward', value: `${totalOut.toFixed(3)} MT` },
      { label: 'Variance', value: `${totalVar.toFixed(3)} MT` },
      { label: 'Net Stock', value: `${totalNet.toFixed(3)} MT` },
    ],
    totalsRow: {
      inward_weight: totalIn,
      godown_weight: totalIn - totalVar,
      variance: totalVar,
      outward_weight: totalOut,
      net_stock: totalNet,
    },
    data,
  }
}

// ---------------------------------------------------------------------------
// 2. DAILY REPORT CONFIGS
// ---------------------------------------------------------------------------

export function getDailyReportExcelConfig(
  transactions: InventoryTransaction[],
  filters: DailyReportFilters,
  summary: DailyReportSummary
): ExcelExportConfig {
  const base = getTransactionsExcelConfig(transactions, {
    totalInward: summary.totalInward,
    totalOutward: summary.totalOutward,
    totalVariance: summary.totalVariance,
    netStock: summary.netPosition,
  })

  return {
    ...base,
    filename: 'Daily_Weighbridge_Report',
    sheetName: 'Daily Report',
    title: 'Daily Weighbridge Summary Report',
    subtitle: `Period: ${filters.dateFrom ? format(new Date(filters.dateFrom), 'dd/MM/yyyy') : 'Start'} to ${filters.dateTo ? format(new Date(filters.dateTo), 'dd/MM/yyyy') : 'Today'}`,
  }
}

export function getDailyReportPDFConfig(
  transactions: InventoryTransaction[],
  filters: DailyReportFilters,
  summary: DailyReportSummary
): PDFExportConfig {
  const fromStr = filters.dateFrom ? format(new Date(filters.dateFrom), 'dd/MM/yyyy') : 'Start'
  const toStr = filters.dateTo ? format(new Date(filters.dateTo), 'dd/MM/yyyy') : 'Today'

  const base = getTransactionsPDFConfig(
    transactions,
    {
      totalInward: summary.totalInward,
      totalOutward: summary.totalOutward,
      totalVariance: summary.totalVariance,
      netStock: summary.netPosition,
    },
    `Period: ${fromStr} to ${toStr}`
  )

  return {
    ...base,
    filename: 'Daily_Weighbridge_Report',
    reportTitle: 'Daily Weighbridge Summary Report',
  }
}

// ---------------------------------------------------------------------------
// 3. STOCK REPORT CONFIGS
// ---------------------------------------------------------------------------

export function prepareStockExportRows(rows: QualityStockRow[]) {
  const exportData: any[] = []

  rows.forEach((r) => {
    exportData.push({
      quality_name: r.quality.quality_name,
      quality_code: r.quality.quality_code,
      category: r.quality.category || 'Scrap',
      godown_name: 'All Assigned Bays',
      totalInward: r.totalInward,
      totalOutward: r.totalOutward,
      currentStock: r.currentStock,
      stockPercentage: `${r.stockPercentage}%`,
    })

    // Sub-rows
    r.godownBreakdowns.forEach((gb) => {
      exportData.push({
        quality_name: `  ↳ ${r.quality.quality_name} (${gb.godown.godown_code})`,
        quality_code: gb.godown.godown_code,
        category: r.quality.category || 'Scrap',
        godown_name: gb.godown.godown_name,
        totalInward: gb.totalInward,
        totalOutward: gb.totalOutward,
        currentStock: gb.currentStock,
        stockPercentage: `${gb.stockPercentage}% of grade`,
      })
    })
  })

  return exportData
}

export function getStockReportExcelConfig(
  rows: QualityStockRow[],
  filters: StockReportFilters,
  summary: StockReportSummary
): ExcelExportConfig {
  const data = prepareStockExportRows(rows)

  return {
    filename: 'Godown_Stock_Report',
    sheetName: 'Stock Summary',
    title: 'Godown Physical Stock & Quality Balance Report',
    subtitle: `As of Date: ${filters.asOfDate ? format(new Date(filters.asOfDate), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')}`,
    headers: [
      { key: 'quality_name', label: 'Quality Grade / Bay', width: 26 },
      { key: 'quality_code', label: 'Code', width: 12 },
      { key: 'category', label: 'Category', width: 14 },
      { key: 'godown_name', label: 'Godown Location', width: 20 },
      { key: 'totalInward', label: 'Total Inward (MT)', width: 16, type: 'weight' },
      { key: 'totalOutward', label: 'Total Outward (MT)', width: 16, type: 'weight' },
      { key: 'currentStock', label: 'Current Stock (MT)', width: 16, type: 'weight' },
      { key: 'stockPercentage', label: 'Stock %', width: 14 },
    ],
    summaryData: [
      { label: 'Total Qualities', value: `${summary.totalQualities}` },
      { label: 'Total Inward', value: `${summary.totalInward.toFixed(3)} MT` },
      { label: 'Total Outward', value: `${summary.totalOutward.toFixed(3)} MT` },
      { label: 'Net Physical Stock', value: `${summary.currentStock.toFixed(3)} MT` },
    ],
    totalsRow: {
      totalInward: summary.totalInward,
      totalOutward: summary.totalOutward,
      currentStock: summary.currentStock,
      stockPercentage: '100%',
    },
    data,
  }
}

export function getStockReportPDFConfig(
  rows: QualityStockRow[],
  filters: StockReportFilters,
  summary: StockReportSummary
): PDFExportConfig {
  // Primary rows without nested prefix for cleaner PDF
  const data = rows.map((r) => ({
    quality_name: r.quality.quality_name,
    quality_code: r.quality.quality_code,
    category: r.quality.category || 'Scrap',
    totalInward: r.totalInward,
    totalOutward: r.totalOutward,
    currentStock: r.currentStock,
    stockPercentage: `${r.stockPercentage}%`,
  }))

  const asOfStr = filters.asOfDate ? format(new Date(filters.asOfDate), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy')

  return {
    filename: 'Godown_Stock_Report',
    reportTitle: 'Godown Physical Stock & Quality Balance Report',
    filterDescription: `As of Date: ${asOfStr}`,
    orientation: 'landscape',
    columns: [
      { header: 'Quality Grade', dataKey: 'quality_name', width: 50 },
      { header: 'Code', dataKey: 'quality_code', width: 22 },
      { header: 'Category', dataKey: 'category', width: 28 },
      { header: 'Total Inward (MT)', dataKey: 'totalInward', width: 38, type: 'weight', align: 'right' },
      { header: 'Total Outward (MT)', dataKey: 'totalOutward', width: 38, type: 'weight', align: 'right' },
      { header: 'Current Stock (MT)', dataKey: 'currentStock', width: 38, type: 'weight', align: 'right' },
      { header: 'Stock %', dataKey: 'stockPercentage', width: 22, align: 'right' },
    ],
    summaryItems: [
      { label: 'Grades Tracked', value: `${summary.totalQualities}` },
      { label: 'Total Inward', value: `${summary.totalInward.toFixed(3)} MT` },
      { label: 'Total Outward', value: `${summary.totalOutward.toFixed(3)} MT` },
      { label: 'Net Holding Stock', value: `${summary.currentStock.toFixed(3)} MT` },
    ],
    totalsRow: {
      totalInward: summary.totalInward,
      totalOutward: summary.totalOutward,
      currentStock: summary.currentStock,
      stockPercentage: '100%',
    },
    data,
  }
}

// ---------------------------------------------------------------------------
// 4. PARTY REPORT CONFIGS
// ---------------------------------------------------------------------------

export function preparePartyExportRows(rows: PartyReportRow[]) {
  return rows.map((r) => ({
    party_name: r.party.party_name,
    party_code: r.party.party_code,
    city: r.party.city || '—',
    state: r.party.state || '—',
    gst_number: r.party.gst_number || '—',
    transactionCount: r.transactionCount,
    totalInward: r.totalInward,
    totalOutward: r.totalOutward,
    netStock: r.netStock,
    avgWeight: r.avgWeight,
  }))
}

export function getPartyReportExcelConfig(
  rows: PartyReportRow[],
  filters: PartyReportFilters,
  summary: PartyReportSummary
): ExcelExportConfig {
  const data = preparePartyExportRows(rows)

  const fromStr = filters.dateFrom ? format(new Date(filters.dateFrom), 'dd/MM/yyyy') : 'Start'
  const toStr = filters.dateTo ? format(new Date(filters.dateTo), 'dd/MM/yyyy') : 'Today'

  return {
    filename: 'Party_Ledger_Report',
    sheetName: 'Party Ledger',
    title: 'Party & Supplier Consignment Ledger Report',
    subtitle: `Period: ${fromStr} to ${toStr}`,
    headers: [
      { key: 'party_name', label: 'Party Name', width: 24 },
      { key: 'party_code', label: 'Code', width: 12 },
      { key: 'city', label: 'City', width: 16 },
      { key: 'gst_number', label: 'GST Number', width: 18 },
      { key: 'transactionCount', label: 'Slips', width: 10, type: 'number' },
      { key: 'totalInward', label: 'Inward (MT)', width: 14, type: 'weight' },
      { key: 'totalOutward', label: 'Outward (MT)', width: 14, type: 'weight' },
      { key: 'netStock', label: 'Net Position (MT)', width: 16, type: 'weight' },
      { key: 'avgWeight', label: 'Avg Weight (MT)', width: 14, type: 'weight' },
    ],
    summaryData: [
      { label: 'Total Parties', value: `${summary.totalParties}` },
      { label: 'Total Slips', value: `${summary.totalTransactions}` },
      { label: 'Total Inward', value: `${summary.totalInward.toFixed(3)} MT` },
      { label: 'Total Outward', value: `${summary.totalOutward.toFixed(3)} MT` },
      { label: 'Net Consignments', value: `${summary.netStock.toFixed(3)} MT` },
      { label: 'Avg Weight', value: `${summary.avgWeight.toFixed(3)} MT` },
    ],
    totalsRow: {
      transactionCount: summary.totalTransactions,
      totalInward: summary.totalInward,
      totalOutward: summary.totalOutward,
      netStock: summary.netStock,
      avgWeight: summary.avgWeight,
    },
    data,
  }
}

export function getPartyReportPDFConfig(
  rows: PartyReportRow[],
  filters: PartyReportFilters,
  summary: PartyReportSummary
): PDFExportConfig {
  const data = preparePartyExportRows(rows)

  const fromStr = filters.dateFrom ? format(new Date(filters.dateFrom), 'dd/MM/yyyy') : 'Start'
  const toStr = filters.dateTo ? format(new Date(filters.dateTo), 'dd/MM/yyyy') : 'Today'

  return {
    filename: 'Party_Ledger_Report',
    reportTitle: 'Party & Supplier Consignment Ledger Report',
    filterDescription: `Period: ${fromStr} to ${toStr}`,
    orientation: 'landscape',
    columns: [
      { header: 'Party / Client', dataKey: 'party_name', width: 50 },
      { header: 'Code', dataKey: 'party_code', width: 18 },
      { header: 'City', dataKey: 'city', width: 26 },
      { header: 'Slips', dataKey: 'transactionCount', width: 16, align: 'center' },
      { header: 'Total Inward (MT)', dataKey: 'totalInward', width: 34, type: 'weight', align: 'right' },
      { header: 'Total Outward (MT)', dataKey: 'totalOutward', width: 34, type: 'weight', align: 'right' },
      { header: 'Net Position (MT)', dataKey: 'netStock', width: 34, type: 'weight', align: 'right' },
      { header: 'Avg/Slip (MT)', dataKey: 'avgWeight', width: 26, type: 'weight', align: 'right' },
    ],
    summaryItems: [
      { label: 'Parties', value: `${summary.totalParties}` },
      { label: 'Total Slips', value: `${summary.totalTransactions}` },
      { label: 'Total Inward', value: `${summary.totalInward.toFixed(3)} MT` },
      { label: 'Total Outward', value: `${summary.totalOutward.toFixed(3)} MT` },
      { label: 'Net Position', value: `${summary.netStock.toFixed(3)} MT` },
    ],
    totalsRow: {
      transactionCount: summary.totalTransactions,
      totalInward: summary.totalInward,
      totalOutward: summary.totalOutward,
      netStock: summary.netStock,
      avgWeight: summary.avgWeight,
    },
    data,
  }
}

// ---------------------------------------------------------------------------
// 5. VEHICLE REPORT CONFIGS
// ---------------------------------------------------------------------------

export function prepareVehicleExportRows(rows: VehicleReportRow[]) {
  return rows.map((r) => ({
    lorryNumber: r.lorryNumber,
    ownerName: r.ownerName,
    vehicleType: r.vehicleType,
    inwardTrips: r.inwardTrips,
    totalInwardMT: r.totalInwardMT,
    outwardTrips: r.outwardTrips,
    totalOutwardMT: r.totalOutwardMT,
    totalTrips: r.totalTrips,
    totalVolume: r.totalVolume,
  }))
}

export function getVehicleReportExcelConfig(
  rows: VehicleReportRow[],
  filters: VehicleReportFilters,
  summary: VehicleReportSummary
): ExcelExportConfig {
  const data = prepareVehicleExportRows(rows)

  const fromStr = filters.dateFrom ? format(new Date(filters.dateFrom), 'dd/MM/yyyy') : 'Start'
  const toStr = filters.dateTo ? format(new Date(filters.dateTo), 'dd/MM/yyyy') : 'Today'

  return {
    filename: 'Vehicle_Movement_Report',
    sheetName: 'Vehicle Movements',
    title: 'Fleet Logistics & Vehicle Movement Report',
    subtitle: `Period: ${fromStr} to ${toStr}`,
    headers: [
      { key: 'lorryNumber', label: 'Lorry Number', width: 18 },
      { key: 'ownerName', label: 'Transporter / Owner', width: 24 },
      { key: 'vehicleType', label: 'Fleet Type', width: 14 },
      { key: 'inwardTrips', label: 'Inward Trips', width: 14, type: 'number' },
      { key: 'totalInwardMT', label: 'Inward (MT)', width: 16, type: 'weight' },
      { key: 'outwardTrips', label: 'Outward Trips', width: 14, type: 'number' },
      { key: 'totalOutwardMT', label: 'Outward (MT)', width: 16, type: 'weight' },
      { key: 'totalTrips', label: 'Total Trips', width: 14, type: 'number' },
      { key: 'totalVolume', label: 'Total Haulage (MT)', width: 18, type: 'weight' },
    ],
    summaryData: [
      { label: 'Total Vehicles', value: `${summary.totalVehicles}` },
      { label: 'Total Trips', value: `${summary.totalTrips}` },
      { label: 'Inward Trips', value: `${summary.inwardTrips}` },
      { label: 'Outward Trips', value: `${summary.outwardTrips}` },
      { label: 'Total Inward', value: `${summary.totalInwardMT.toFixed(3)} MT` },
      { label: 'Total Outward', value: `${summary.totalOutwardMT.toFixed(3)} MT` },
    ],
    totalsRow: {
      inwardTrips: summary.inwardTrips,
      totalInwardMT: summary.totalInwardMT,
      outwardTrips: summary.outwardTrips,
      totalOutwardMT: summary.totalOutwardMT,
      totalTrips: summary.totalTrips,
      totalVolume: summary.totalInwardMT + summary.totalOutwardMT,
    },
    data,
  }
}

export function getVehicleReportPDFConfig(
  rows: VehicleReportRow[],
  filters: VehicleReportFilters,
  summary: VehicleReportSummary
): PDFExportConfig {
  const data = prepareVehicleExportRows(rows)

  const fromStr = filters.dateFrom ? format(new Date(filters.dateFrom), 'dd/MM/yyyy') : 'Start'
  const toStr = filters.dateTo ? format(new Date(filters.dateTo), 'dd/MM/yyyy') : 'Today'

  return {
    filename: 'Vehicle_Movement_Report',
    reportTitle: 'Fleet Logistics & Vehicle Movement Report',
    filterDescription: `Period: ${fromStr} to ${toStr}`,
    orientation: 'landscape',
    columns: [
      { header: 'Lorry Number', dataKey: 'lorryNumber', width: 28 },
      { header: 'Transporter', dataKey: 'ownerName', width: 45 },
      { header: 'Type', dataKey: 'vehicleType', width: 22 },
      { header: 'Inward Trips', dataKey: 'inwardTrips', width: 22, align: 'center' },
      { header: 'Inward (MT)', dataKey: 'totalInwardMT', width: 30, type: 'weight', align: 'right' },
      { header: 'Outward Trips', dataKey: 'outwardTrips', width: 22, align: 'center' },
      { header: 'Outward (MT)', dataKey: 'totalOutwardMT', width: 30, type: 'weight', align: 'right' },
      { header: 'Total Trips', dataKey: 'totalTrips', width: 22, align: 'center' },
    ],
    summaryItems: [
      { label: 'Active Lorries', value: `${summary.totalVehicles}` },
      { label: 'Total Trips', value: `${summary.totalTrips}` },
      { label: 'Inward MT', value: `${summary.totalInwardMT.toFixed(3)} MT` },
      { label: 'Outward MT', value: `${summary.totalOutwardMT.toFixed(3)} MT` },
      { label: 'Total Haulage', value: `${(summary.totalInwardMT + summary.totalOutwardMT).toFixed(3)} MT` },
    ],
    totalsRow: {
      inwardTrips: summary.inwardTrips,
      totalInwardMT: summary.totalInwardMT,
      outwardTrips: summary.outwardTrips,
      totalOutwardMT: summary.totalOutwardMT,
      totalTrips: summary.totalTrips,
    },
    data,
  }
}

// ---------------------------------------------------------------------------
// 6. DISPATCH SHEET EXPORT CONFIGS
// ---------------------------------------------------------------------------

export function prepareDispatchExportRows(dispatches: DispatchEntry[]) {
  return dispatches.map((d) => {
    let dateStr = d.dispatch_date
    try {
      const dt = new Date(d.dispatch_date)
      if (!isNaN(dt.getTime())) {
        dateStr = format(dt, 'dd/MM/yyyy')
      }
    } catch {
      // ignore
    }

    return {
      date: dateStr,
      quality_name: d.qualities?.quality_name || d.quality_id,
      lorry_number: d.lorry_number,
      bill_weight: d.bill_weight,
      party_name: d.parties?.party_name || d.party_id,
      bill_number: d.bill_number || '—',
      transporter: d.transporter,
      dispatch_bill_number: d.dispatch_bill_number,
      remarks: d.remarks || '—',
      status: d.status.toUpperCase(),
    }
  })
}

export function getDispatchExcelConfig(
  dispatches: DispatchEntry[],
  summary?: DispatchSummary,
  filters?: DispatchFilters
): ExcelExportConfig {
  const data = prepareDispatchExportRows(dispatches)
  const totalWeight =
    summary?.totalBillWeight ??
    dispatches.reduce((sum, d) => sum + (d.bill_weight || 0), 0)

  const dateFrom = filters?.dateFrom
    ? format(new Date(filters.dateFrom), 'dd/MM/yyyy')
    : 'All Time'
  const dateTo = filters?.dateTo
    ? format(new Date(filters.dateTo), 'dd/MM/yyyy')
    : 'Present'

  return {
    filename: 'Dispatch_Sheet',
    sheetName: 'Dispatch Sheet',
    title: 'DISPATCH SHEET — BRS METALS ENTERPRISE',
    subtitle: `Period: ${dateFrom} to ${dateTo} | Total Records: ${dispatches.length}`,
    headers: [
      { key: 'date', label: 'DATE', width: 12, type: 'date' },
      { key: 'quality_name', label: 'Quality', width: 18 },
      { key: 'lorry_number', label: 'LORRY No', width: 16 },
      { key: 'bill_weight', label: 'Bill Wt (MT)', width: 14, type: 'weight' },
      { key: 'party_name', label: 'Party Name', width: 22 },
      { key: 'bill_number', label: 'Bill No', width: 14 },
      { key: 'transporter', label: 'Transporter', width: 22 },
      { key: 'dispatch_bill_number', label: 'BILL NO', width: 14 },
      { key: 'remarks', label: 'Remarks', width: 25 },
      { key: 'status', label: 'Status', width: 12 },
    ],
    summaryData: [
      { label: 'Total Dispatches', value: `${dispatches.length}` },
      { label: 'Total Bill Weight', value: `${totalWeight.toFixed(3)} MT` },
      { label: 'Unique Parties', value: `${summary?.uniqueParties ?? '—'}` },
      { label: 'Unique Lorries', value: `${summary?.uniqueLorries ?? '—'}` },
      { label: 'Unique Transporters', value: `${summary?.uniqueTransporters ?? '—'}` },
    ],
    totalsRow: {
      date: 'TOTAL',
      bill_weight: totalWeight,
    },
    data,
  }
}

export function getDispatchPDFConfig(
  dispatches: DispatchEntry[],
  summary?: DispatchSummary,
  filters?: DispatchFilters
): PDFExportConfig {
  const data = prepareDispatchExportRows(dispatches)
  const totalWeight =
    summary?.totalBillWeight ??
    dispatches.reduce((sum, d) => sum + (d.bill_weight || 0), 0)

  const dateFrom = filters?.dateFrom
    ? format(new Date(filters.dateFrom), 'dd/MM/yyyy')
    : 'Start'
  const dateTo = filters?.dateTo
    ? format(new Date(filters.dateTo), 'dd/MM/yyyy')
    : 'Present'

  return {
    filename: 'Dispatch_Sheet',
    reportTitle: 'Outward Dispatch Register & Weighment Sheet',
    filterDescription: `Period: ${dateFrom} to ${dateTo} | Consignments: ${dispatches.length}`,
    orientation: 'landscape',
    columns: [
      { header: 'DATE', dataKey: 'date', width: 22 },
      { header: 'Quality', dataKey: 'quality_name', width: 28 },
      { header: 'LORRY No', dataKey: 'lorry_number', width: 30 },
      { header: 'Bill Wt (MT)', dataKey: 'bill_weight', width: 24, type: 'weight', align: 'right' },
      { header: 'Party Name', dataKey: 'party_name', width: 40 },
      { header: 'Bill No', dataKey: 'bill_number', width: 22 },
      { header: 'Transporter', dataKey: 'transporter', width: 38 },
      { header: 'BILL NO', dataKey: 'dispatch_bill_number', width: 22 },
      { header: 'Status', dataKey: 'status', width: 20, align: 'center' },
      { header: 'Remarks', dataKey: 'remarks', width: 32 },
    ],
    summaryItems: [
      { label: 'Total Dispatches', value: `${dispatches.length}` },
      { label: 'Total Bill Wt', value: `${totalWeight.toFixed(3)} MT` },
      { label: 'Period', value: `${dateFrom} - ${dateTo}` },
    ],
    totalsRow: {
      date: 'TOTALS',
      bill_weight: totalWeight,
    },
    data,
  }
}

export function getDispatchCSVData(dispatches: DispatchEntry[]) {
  const rows = prepareDispatchExportRows(dispatches)
  const headers = [
    { key: 'date', label: 'DATE' },
    { key: 'quality_name', label: 'Quality' },
    { key: 'lorry_number', label: 'LORRY No' },
    { key: 'bill_weight', label: 'Bill Wt' },
    { key: 'party_name', label: 'Party Name' },
    { key: 'bill_number', label: 'Bill No' },
    { key: 'transporter', label: 'Transporter' },
    { key: 'dispatch_bill_number', label: 'BILL NO' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'status', label: 'Status' },
  ]
  return { headers, data: rows, filename: `Dispatch_Sheet_${format(new Date(), 'yyyyMMdd')}` }
}

// ---------------------------------------------------------------------------
// 7. BILL & UNDER BILLING REGISTER AND PENDING RTGS EXPORT CONFIGS
// ---------------------------------------------------------------------------

export function prepareBillExportRows(bills: BillEntry[]) {
  return bills.map((b) => {
    const formattedDate = b.bill_date
      ? format(new Date(b.bill_date), 'dd/MM/yyyy')
      : '—'
    return {
      date: formattedDate,
      party_code: b.party_code || b.parties?.party_code || '—',
      party_name: b.parties?.party_name || '—',
      quality_name: b.qualities?.quality_name || b.quality_id,
      lorry_number: b.lorry_number,
      quantity_mt: b.quantity_mt,
      bill_rate: b.bill_rate,
      actual_rate: b.actual_rate,
      rate_difference: b.rate_difference,
      rtgs_amount: b.rtgs_amount,
      bill_number: b.bill_number || '—',
      payment_status: b.payment_status.toUpperCase(),
      rtgs_reference: b.rtgs_reference || '—',
      remarks: b.remarks || '—',
    }
  })
}

export function getBillExcelConfig(
  bills: BillEntry[],
  summary?: BillSummary,
  filters?: BillFilters
): ExcelExportConfig {
  const data = prepareBillExportRows(bills)
  const totalQty =
    summary?.totalQuantityMT ??
    bills.reduce((sum, b) => sum + (b.quantity_mt || 0), 0)
  const totalRtgs =
    summary?.totalRtgsAmount ??
    bills.reduce((sum, b) => sum + (b.rtgs_amount || 0), 0)

  const dateFrom = filters?.dateFrom
    ? format(new Date(filters.dateFrom), 'dd/MM/yyyy')
    : 'All Time'
  const dateTo = filters?.dateTo
    ? format(new Date(filters.dateTo), 'dd/MM/yyyy')
    : 'Present'

  return {
    filename: 'Bill_Under_Billing_Register',
    sheetName: 'Bill Sheet',
    title: 'BILL & UNDER BILLING REGISTER — BRS METALS',
    subtitle: `Period: ${dateFrom} to ${dateTo} | Total Records: ${bills.length}`,
    headers: [
      { key: 'date', label: 'DATE', width: 12, type: 'date' },
      { key: 'party_code', label: 'From', width: 10 },
      { key: 'party_name', label: 'Party Name', width: 24 },
      { key: 'quality_name', label: 'Quality', width: 16 },
      { key: 'lorry_number', label: 'LORRY No', width: 16 },
      { key: 'quantity_mt', label: 'qty (MT)', width: 12, type: 'weight' },
      { key: 'bill_rate', label: 'bill rate (₹/kg)', width: 14, type: 'number' },
      { key: 'actual_rate', label: 'Rate/kg (₹/kg)', width: 14, type: 'number' },
      { key: 'rate_difference', label: 'BILL AMT (₹/kg)', width: 15, type: 'number' },
      { key: 'rtgs_amount', label: 'RTGS/AMT (₹)', width: 16, type: 'number' },
      { key: 'bill_number', label: 'Bill No', width: 14 },
      { key: 'payment_status', label: 'Status', width: 12 },
      { key: 'rtgs_reference', label: 'RTGS Ref', width: 20 },
      { key: 'remarks', label: 'Remarks', width: 25 },
    ],
    summaryData: [
      { label: 'Total Bills', value: `${bills.length}` },
      { label: 'Total Weight', value: `${totalQty.toFixed(3)} MT` },
      { label: 'Under Billing Total', value: `₹${(summary?.totalUnderBillingAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Over Billing Total', value: `₹${Math.abs(summary?.totalOverBillingAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
      { label: 'Net RTGS Amount', value: `₹${totalRtgs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    ],
    totalsRow: {
      date: 'TOTALS',
      quantity_mt: totalQty,
      rtgs_amount: totalRtgs,
    },
    data,
  }
}

export function getBillPDFConfig(
  bills: BillEntry[],
  summary?: BillSummary,
  filters?: BillFilters
): PDFExportConfig {
  const data = prepareBillExportRows(bills)
  const totalQty =
    summary?.totalQuantityMT ??
    bills.reduce((sum, b) => sum + (b.quantity_mt || 0), 0)
  const totalRtgs =
    summary?.totalRtgsAmount ??
    bills.reduce((sum, b) => sum + (b.rtgs_amount || 0), 0)

  const dateFrom = filters?.dateFrom
    ? format(new Date(filters.dateFrom), 'dd/MM/yyyy')
    : 'Start'
  const dateTo = filters?.dateTo
    ? format(new Date(filters.dateTo), 'dd/MM/yyyy')
    : 'Present'

  return {
    filename: 'Bill_Under_Billing_Report',
    reportTitle: 'Bill & Under Billing Calculation Register',
    filterDescription: `Period: ${dateFrom} to ${dateTo} | Consignments: ${bills.length}`,
    orientation: 'landscape',
    columns: [
      { header: 'DATE', dataKey: 'date', width: 20 },
      { header: 'From', dataKey: 'party_code', width: 18 },
      { header: 'Party Name', dataKey: 'party_name', width: 36 },
      { header: 'Quality', dataKey: 'quality_name', width: 24 },
      { header: 'LORRY No', dataKey: 'lorry_number', width: 26 },
      { header: 'qty (MT)', dataKey: 'quantity_mt', width: 20, type: 'weight', align: 'right' },
      { header: 'Bill Rate', dataKey: 'bill_rate', width: 18, align: 'right' },
      { header: 'Rate/kg', dataKey: 'actual_rate', width: 18, align: 'right' },
      { header: 'BILL AMT', dataKey: 'rate_difference', width: 20, align: 'right' },
      { header: 'RTGS/AMT (₹)', dataKey: 'rtgs_amount', width: 24, align: 'right' },
      { header: 'Status', dataKey: 'payment_status', width: 18, align: 'center' },
      { header: 'RTGS Ref', dataKey: 'rtgs_reference', width: 26 },
    ],
    summaryItems: [
      { label: 'Total Entries', value: `${bills.length}` },
      { label: 'Total Weight', value: `${totalQty.toFixed(3)} MT` },
      { label: 'Net RTGS', value: `₹${totalRtgs.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    ],
    totalsRow: {
      date: 'TOTALS',
      quantity_mt: totalQty,
      rtgs_amount: totalRtgs,
    },
    data,
  }
}

export function getBillCSVData(bills: BillEntry[]) {
  const rows = prepareBillExportRows(bills)
  const headers = [
    { key: 'date', label: 'DATE' },
    { key: 'party_code', label: 'From' },
    { key: 'party_name', label: 'Party Name' },
    { key: 'quality_name', label: 'Quality' },
    { key: 'lorry_number', label: 'LORRY No' },
    { key: 'quantity_mt', label: 'qty' },
    { key: 'bill_rate', label: 'bill rate' },
    { key: 'actual_rate', label: 'Rate/kg' },
    { key: 'rate_difference', label: 'BILL AMT' },
    { key: 'rtgs_amount', label: 'RTGS/AMT' },
    { key: 'bill_number', label: 'Bill No' },
    { key: 'payment_status', label: 'Status' },
    { key: 'rtgs_reference', label: 'RTGS Ref' },
    { key: 'remarks', label: 'Remarks' },
  ]
  return { headers, data: rows, filename: `Bill_Sheet_${format(new Date(), 'yyyyMMdd')}` }
}

export function getPendingRTGSExcelConfig(pendingBills: BillEntry[]): ExcelExportConfig {
  const data = prepareBillExportRows(pendingBills)
  const totalOutstanding = pendingBills.reduce(
    (sum, b) => sum + Math.abs(b.rtgs_amount || 0),
    0
  )
  const totalWeight = pendingBills.reduce(
    (sum, b) => sum + (b.quantity_mt || 0),
    0
  )

  return {
    filename: 'Pending_RTGS_Payments_Report',
    sheetName: 'Pending RTGS',
    title: 'PENDING RTGS PAYMENTS SCHEDULE — BRS METALS',
    subtitle: `Total Outstanding Entries: ${pendingBills.length}`,
    headers: [
      { key: 'date', label: 'DATE', width: 12, type: 'date' },
      { key: 'party_code', label: 'From', width: 10 },
      { key: 'party_name', label: 'Party Name', width: 24 },
      { key: 'quality_name', label: 'Quality', width: 16 },
      { key: 'lorry_number', label: 'LORRY No', width: 16 },
      { key: 'quantity_mt', label: 'qty (MT)', width: 12, type: 'weight' },
      { key: 'bill_rate', label: 'bill rate', width: 12 },
      { key: 'actual_rate', label: 'Rate/kg', width: 12 },
      { key: 'rate_difference', label: 'BILL AMT', width: 14 },
      { key: 'rtgs_amount', label: 'RTGS Payable (₹)', width: 18, type: 'number' },
      { key: 'bill_number', label: 'Bill No', width: 14 },
      { key: 'payment_status', label: 'Status', width: 12 },
      { key: 'remarks', label: 'Remarks', width: 25 },
    ],
    summaryData: [
      { label: 'Pending Records', value: `${pendingBills.length}` },
      { label: 'Total Weight Pending', value: `${totalWeight.toFixed(3)} MT` },
      {
        label: 'Total Outstanding RTGS',
        value: `₹${totalOutstanding.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`,
      },
    ],
    totalsRow: {
      date: 'TOTALS',
      quantity_mt: totalWeight,
      rtgs_amount: totalOutstanding,
    },
    data,
  }
}

export function getPendingRTGSPDFConfig(pendingBills: BillEntry[]): PDFExportConfig {
  const data = prepareBillExportRows(pendingBills)
  const totalOutstanding = pendingBills.reduce(
    (sum, b) => sum + Math.abs(b.rtgs_amount || 0),
    0
  )
  const totalWeight = pendingBills.reduce(
    (sum, b) => sum + (b.quantity_mt || 0),
    0
  )

  return {
    filename: 'Pending_RTGS_Payments_Report',
    reportTitle: 'PENDING RTGS PAYMENTS STATEMENT',
    filterDescription: `Awaiting Settlement • Outstanding Records: ${pendingBills.length}`,
    orientation: 'landscape',
    columns: [
      { header: 'DATE', dataKey: 'date', width: 22 },
      { header: 'From', dataKey: 'party_code', width: 18 },
      { header: 'Party Name', dataKey: 'party_name', width: 42 },
      { header: 'Quality', dataKey: 'quality_name', width: 26 },
      { header: 'LORRY No', dataKey: 'lorry_number', width: 28 },
      { header: 'qty (MT)', dataKey: 'quantity_mt', width: 22, type: 'weight', align: 'right' },
      { header: 'BILL AMT', dataKey: 'rate_difference', width: 22, align: 'right' },
      { header: 'RTGS Payable (₹)', dataKey: 'rtgs_amount', width: 30, align: 'right' },
      { header: 'Bill No', dataKey: 'bill_number', width: 22 },
      { header: 'Status', dataKey: 'payment_status', width: 20, align: 'center' },
    ],
    summaryItems: [
      { label: 'Pending Bills', value: `${pendingBills.length}` },
      { label: 'Total Weight', value: `${totalWeight.toFixed(3)} MT` },
      {
        label: 'Total Outstanding',
        value: `₹${totalOutstanding.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}`,
      },
    ],
    totalsRow: {
      date: 'TOTALS',
      quantity_mt: totalWeight,
      rtgs_amount: totalOutstanding,
    },
    data,
  }
}
