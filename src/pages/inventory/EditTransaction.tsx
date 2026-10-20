import { formatISTDateTime } from '@lib/dateUtils'
import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, AlertCircle, FileText, Clock, User, Pencil } from 'lucide-react'
import { TransactionForm } from '@components/inventory/TransactionForm'
import { useInventory } from '@hooks/useInventory'

export function EditTransaction() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getTransactionById } = useInventory()

  const transaction = useMemo(() => {
    if (!id) return undefined
    return getTransactionById(id)
  }, [id, getTransactionById])

  const initialValues = useMemo(() => {
    if (!transaction) return undefined
    return {
      transaction_date: new Date(transaction.transaction_date),
      party_id: transaction.party_id,
      quality_id: transaction.quality_id,
      godown_id: transaction.godown_id || '',
      vehicle_in_id: transaction.vehicles_in?.lorry_number || transaction.vehicle_in_id || '',
      bill_number: transaction.bill_number,
      inward_weight: transaction.inward_weight,
      godown_weight: transaction.godown_weight,
      vehicle_out_id: transaction.vehicles_out?.lorry_number || transaction.vehicle_out_id || '',
      outward_weight: transaction.outward_weight,
      remarks: transaction.remarks || '',
      status: transaction.status === 'cancelled' ? 'completed' : transaction.status,
    }
  }, [transaction])

  const handleSuccess = () => {
    navigate('/inventory/list')
  }

  if (!transaction) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 select-none">
        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 inline-block">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Transaction Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          The transaction record with ID or Bill Number <strong className="font-mono">"{id}"</strong> could not be located. It may have been deleted or archived.
        </p>
        <div className="pt-2">
          <Link
            to="/inventory/list"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Transactions List</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto px-1 sm:px-0">
      {/* Top Header Navigation Strip */}
      <div className="space-y-3 mb-6">
        {/* Top meta row: Back Link & Date */}
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <Link
            to="/inventory/list"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Transactions</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {format(new Date(transaction.transaction_date), 'EEE, dd MMM yyyy')}
          </span>
        </div>

        {/* Title Row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              <span>Edit Transaction &mdash; {transaction.bill_number}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Modify weighbridge recordings, storage yard assignment, or dispatch details
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/inventory/list')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition shadow-2xs shrink-0 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-slate-500" />
            <span>Cancel &amp; Return</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <TransactionForm
        key={transaction.id}
        transactionId={transaction.id}
        isEditing={true}
        initialValues={initialValues}
        onSuccess={handleSuccess}
      />

      {/* Audit Meta Footer */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <span>
            Record ID: <strong className="font-mono text-slate-700">{transaction.id}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            Created by: {transaction.created_by}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            Last updated: {formatISTDateTime(transaction.updated_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default EditTransaction
