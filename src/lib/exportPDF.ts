import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { toast } from 'sonner'

export interface PDFExportConfig {
  filename: string
  reportTitle: string
  filterDescription?: string
  columns: {
    header: string
    dataKey: string
    width?: number
    align?: 'left' | 'center' | 'right'
    type?: 'weight' | 'date' | 'text' | 'number'
  }[]
  data: Record<string, any>[]
  summaryItems?: { label: string; value: string }[]
  totalsRow?: Record<string, any>
  orientation?: 'portrait' | 'landscape'
}

/**
 * Helper to format raw values into clean PDF table strings.
 */
function formatPDFValue(
  value: any,
  type?: 'weight' | 'date' | 'text' | 'number'
): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (type === 'weight' && typeof value === 'number') {
    return `${value.toFixed(3)} MT`
  }

  if (type === 'date' || value instanceof Date) {
    try {
      const d = value instanceof Date ? value : new Date(value)
      return isNaN(d.getTime()) ? String(value) : format(d, 'dd/MM/yyyy')
    } catch {
      return String(value)
    }
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    try {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        return format(d, 'dd/MM/yyyy')
      }
    } catch {
      // fallback
    }
  }

  if (typeof value === 'number') {
    return typeof value === 'number' && !Number.isInteger(value)
      ? value.toFixed(3)
      : String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  const str = String(value)
  return str.length > 32 ? `${str.slice(0, 30)}...` : str
}

/**
 * Generates and downloads a publication-grade PDF report.
 */
export function exportToPDF(config: PDFExportConfig): void {
  if (!config.data || config.data.length === 0) {
    toast.warning('No data available to export')
    return
  }

  if (config.data.length >= 500) {
    toast.info('Preparing large PDF export...')
  }

  try {
    const orientation = config.orientation || 'landscape'
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let currentY = 14

    // 1. Header Section
    // Blue accent bar / logo pill
    doc.setFillColor(30, 58, 95) // Dark navy #1E3A5F
    doc.roundedRect(14, currentY, 8, 8, 1.5, 1.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('BRS', 15.5, currentY + 5.5)

    // Company Title
    doc.setTextColor(30, 58, 95)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('INVENTORY MANAGEMENT SYSTEM', 26, currentY + 4.5)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text('Enterprise Weighbridge & Warehouse Logistics Ledger', 26, currentY + 8.5)

    currentY += 14

    // Report Title
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(config.reportTitle, 14, currentY)

    // Generation Meta & Filters
    const timeStr = format(new Date(), 'dd/MM/yyyy HH:mm')
    const filterStr = config.filterDescription
      ? `Filters: ${config.filterDescription}`
      : 'All records included'
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated: ${timeStr}  |  ${filterStr}`, 14, currentY + 4)

    // Thin separator line
    currentY += 7
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(14, currentY, pageWidth - 14, currentY)
    currentY += 4

    // 2. Summary Cards (Row of small metric boxes)
    if (config.summaryItems && config.summaryItems.length > 0) {
      const cardWidth = Math.min(42, (pageWidth - 28 - (config.summaryItems.length - 1) * 3) / config.summaryItems.length)
      const cardHeight = 11

      config.summaryItems.forEach((item, idx) => {
        const x = 14 + idx * (cardWidth + 3)
        // Background
        doc.setFillColor(248, 250, 252)
        doc.setDrawColor(226, 232, 240)
        doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.5, 1.5, 'FD')

        // Label
        doc.setFontSize(6)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(100, 116, 139)
        doc.text(item.label.toUpperCase(), x + 2.5, currentY + 3.8)

        // Value
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 58, 95)
        doc.text(String(item.value), x + 2.5, currentY + 8.5)
      })

      currentY += cardHeight + 4
    }

    // 3. Format Data Table
    const tableHeaders = config.columns.map((c) => c.header)
    const tableBody = config.data.map((row) =>
      config.columns.map((c) => formatPDFValue(row[c.dataKey], c.type))
    )

    // Construct Totals row if provided
    let tableFoot: string[][] | undefined = undefined
    if (config.totalsRow) {
      const footRow = config.columns.map((c, idx) => {
        if (idx === 0 && config.totalsRow?.[c.dataKey] === undefined) {
          return 'TOTALS'
        }
        const val = config.totalsRow?.[c.dataKey]
        if (val === undefined || val === null) return ''
        return formatPDFValue(val, c.type)
      })
      tableFoot = [footRow]
    }

    // Build column styles
    const columnStyles: Record<number, { halign?: 'left' | 'center' | 'right'; cellWidth?: number }> = {}
    config.columns.forEach((c, idx) => {
      columnStyles[idx] = {
        halign: c.align || (c.type === 'weight' ? 'right' : 'left'),
        cellWidth: c.width,
      }
    })

    // Render Table using autoTable
    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableBody,
      foot: tableFoot,
      margin: { left: 14, right: 14, bottom: 16 },
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 2,
        font: 'helvetica',
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [30, 58, 95], // Navy #1E3A5F
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Slate-50
      },
      footStyles: {
        fillColor: [220, 232, 244],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles,
      didDrawPage: (_hookData) => {
        // Footer on each page
        const pageCount = doc.internal.pages.length - 1
        const currentPage = _hookData.pageNumber

        doc.setDrawColor(226, 232, 240)
        doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10)

        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(148, 163, 184)
        doc.text(
          'Confidential — BRS Metals Enterprise Inventory OS',
          pageWidth / 2,
          pageHeight - 6,
          { align: 'center' }
        )

        doc.text(
          `Page ${currentPage} of ${pageCount}`,
          pageWidth - 14,
          pageHeight - 6,
          { align: 'right' }
        )
      },
    })

    // 4. Download File
    const timeStamp = format(new Date(), 'yyyyMMdd_HHmm')
    const cleanFilename = config.filename.replace(/\s+/g, '_')
    doc.save(`${cleanFilename}_${timeStamp}.pdf`)

    toast.success(`Exported ${config.data.length} records to PDF document!`)
  } catch (error) {
    console.error('PDF Export Error:', error)
    toast.error('Failed to generate PDF document')
  }
}

export default exportToPDF
