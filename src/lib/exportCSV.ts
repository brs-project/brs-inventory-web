import { format } from 'date-fns'
import { toast } from 'sonner'

/**
 * Exports an array of objects to a CSV file with UTF-8 BOM support.
 */
export function exportToCSV(
  data: Record<string, any>[],
  filename: string,
  headers?: { key: string; label: string }[]
): void {
  if (!data || data.length === 0) {
    toast.warning('No data available to export')
    return
  }

  try {
    const keys = headers ? headers.map((h) => h.key) : Object.keys(data[0])
    const headerLabels = headers ? headers.map((h) => h.label) : keys

    // Escape CSV cell value
    const formatCSVCell = (val: any): string => {
      if (val === null || val === undefined) {
        return '""'
      }

      if (val instanceof Date) {
        return `"${format(val, 'dd/MM/yyyy')}"`
      }

      if (typeof val === 'number') {
        return String(val)
      }

      if (typeof val === 'boolean') {
        return val ? 'Yes' : 'No'
      }

      if (typeof val === 'object') {
        return `"${String(JSON.stringify(val)).replace(/"/g, '""')}"`
      }

      const str = String(val)
      // Check if it's an ISO date string
      if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
        try {
          const d = new Date(str)
          if (!isNaN(d.getTime())) {
            return `"${format(d, 'dd/MM/yyyy')}"`
          }
        } catch {
          // fallback
        }
      }

      // Escape quotes and wrap in quotes
      return `"${str.replace(/"/g, '""')}"`
    }

    const csvRows: string[] = []

    // 1. Header row
    csvRows.push(headerLabels.map((lbl) => `"${lbl.replace(/"/g, '""')}"`).join(','))

    // 2. Data rows
    for (const row of data) {
      const values = keys.map((key) => formatCSVCell(row[key]))
      csvRows.push(values.join(','))
    }

    // 3. UTF-8 BOM + Content
    const csvContent = '\uFEFF' + csvRows.join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timeStamp = format(new Date(), 'yyyyMMdd_HHmm')
    const cleanFilename = filename.replace(/\s+/g, '_')
    link.setAttribute('href', url)
    link.setAttribute('download', `${cleanFilename}_${timeStamp}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${data.length} records to CSV successfully!`)
  } catch (error) {
    console.error('CSV Export Error:', error)
    toast.error('Failed to export CSV file')
  }
}

export default exportToCSV
