import { formatISTDateTime } from '@lib/dateUtils'
import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useBill } from '@hooks/useBill'
import { PageHeader } from '@components/ui/PageHeader'
import { BillEntryForm } from '@components/billing/BillEntryForm'
import type { BillEntry } from '@types'

export function EditBillEntry() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getBillById, updateBillEntry, isSaving } = useBill()

  const entry = useMemo(() => {
    if (!id) return undefined
    return getBillById(id)
  }, [id, getBillById])

  const handleUpdate = async (
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
    >
  ) => {
    if (!id) return
    await updateBillEntry(id, data)
    navigate('/billing/list')
  }

  if (!entry) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive inline-block">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Bill Entry Not Found
        </h2>
        <p className="text-xs text-muted-foreground">
          The requested billing record could not be found or may have been deleted.
        </p>
        <button
          type="button"
          onClick={() => navigate('/billing/list')}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl shadow-sm hover:bg-primary/90 transition-all inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Bill Sheet</span>
        </button>
      </div>
    )
  }

  const formattedDate = entry.bill_date
    ? format(new Date(entry.bill_date), 'dd/MM/yyyy')
    : ''

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* PAGE HEADER */}
      <PageHeader
        title={`Edit Bill — ${entry.party_code} | ${formattedDate}`}
        subtitle={`Editing invoice ${entry.bill_number || 'reference'} (${entry.parties?.party_name || 'Party'})`}
        actions={
          <button
            type="button"
            onClick={() => navigate('/billing/list')}
            className="px-4 py-2 border border-input hover:bg-muted text-foreground text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <span>Back to List</span>
          </button>
        }
      />

      {/* EDIT FORM */}
      <BillEntryForm
        initialData={entry}
        onSubmit={handleUpdate}
        onCancel={() => navigate('/billing/list')}
        isSubmitting={isSaving}
      />

      {/* AUDIT FOOTER */}
      <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 flex flex-wrap items-center justify-between text-xs text-muted-foreground">
        <div>
          <span>Created: </span>
          <span className="font-medium text-foreground">
            {formatISTDateTime(entry.created_at)} by {entry.created_by}
          </span>
        </div>
        <div>
          <span>Last Updated: </span>
          <span className="font-medium text-foreground">
            {formatISTDateTime(entry.updated_at)}
          </span>
        </div>
      </div>
    </div>
  )
}
