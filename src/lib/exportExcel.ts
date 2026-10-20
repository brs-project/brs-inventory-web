import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { toast } from 'sonner'

export interface ExcelExportConfig {
  filename: string
  sheetName?: string
  data: Record<string, any>[]
  headers: { key: string; label: string; width?: number; type?: 'weight' | 'date' | 'text' | 'number' }[]
  summaryData?: { label: string; value: string | number }[]
  title?: string
  subtitle?: string
  totalsRow?: Record<string, any>
}

/**
 * Generates and downloads a formatted Excel (.xlsx) file.
 */
export function exportToExcel(config: ExcelExportConfig): void {
  if (!config.data || config.data.length === 0) {
    toast.warning('No data available to export')
    return
  }

  if (config.data.length >= 500) {
    toast.info('Preparing large Excel export...')
  }

  try {
    const wb = XLSX.utils.book_new()
    const rows: any[][] = []

    // 1. Title & Meta Rows
    if (config.title) {
      rows.push(['INVENTORY MANAGEMENT SYSTEM — BRS METALS ENTERPRISE'])
      rows.push([config.title.toUpperCase()])
      const timeStr = format(new Date(), 'dd/MM/yyyy HH:mm')
      const sub = config.subtitle ? ` | ${config.subtitle}` : ''
      rows.push([`Generated: ${timeStr}${sub}`])
      rows.push([]) // empty spacing
    }

    // 2. Summary Metrics Block (if provided)
    if (config.summaryData && config.summaryData.length > 0) {
      rows.push(['REPORT SUMMARY METRICS'])
      for (const item of config.summaryData) {
        rows.push([item.label, item.value])
      }
      rows.push([]) // empty spacing
    }

    // 3. Column Header Row
    const headerRow = config.headers.map((h) => h.label)
    rows.push(headerRow)

    // 4. Data Rows Formatting
    for (const item of config.data) {
      const rowData = config.headers.map((h) => {
        const val = item[h.key]

        if (val === null || val === undefined) {
          return '—'
        }

        if (h.type === 'weight' && typeof val === 'number') {
          return Number(val.toFixed(3))
        }

        if (h.type === 'date' || val instanceof Date) {
          try {
            const d = val instanceof Date ? val : new Date(val)
            return isNaN(d.getTime()) ? String(val) : format(d, 'dd/MM/yyyy')
          } catch {
            return String(val)
          }
        }

        // Auto-detect ISO dates
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
          try {
            const d = new Date(val)
            if (!isNaN(d.getTime())) {
              return format(d, 'dd/MM/yyyy')
            }
          } catch {
            // fallback
          }
        }

        if (typeof val === 'number') {
          return val
        }

        if (typeof val === 'boolean') {
          return val ? 'Yes' : 'No'
        }

        return String(val)
      })

      rows.push(rowData)
    }

    // 5. Totals Row (if provided)
    if (config.totalsRow) {
      const totalValues = config.headers.map((h, idx) => {
        if (idx === 0 && config.totalsRow?.[h.key] === undefined) {
          return 'TOTALS'
        }
        const val = config.totalsRow?.[h.key]
        if (val === undefined || val === null) return ''
        if (typeof val === 'number') return Number(val.toFixed(3))
        return String(val)
      })
      rows.push(totalValues)
    }

    // 6. Create Worksheet from Array of Arrays
    const ws = XLSX.utils.aoa_to_sheet(rows)

    // 7. Column Widths
    ws['!cols'] = config.headers.map((h) => ({
      wch: h.width || Math.max(h.label.length + 4, 14),
    }))

    // 8. Append Sheet and Save Workbook
    const sheetTitle = (config.sheetName || 'Report').slice(0, 31)
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle)

    const timeStamp = format(new Date(), 'yyyyMMdd_HHmm')
    const cleanFilename = config.filename.replace(/\s+/g, '_')
    XLSX.writeFile(wb, `${cleanFilename}_${timeStamp}.xlsx`)

    toast.success(`Exported ${config.data.length} records to Excel successfully!`)
  } catch (error) {
    console.error('Excel Export Error:', error)
    toast.error('Failed to export Excel workbook')
  }
}

export default exportToExcel
