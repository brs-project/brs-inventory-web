import { toast } from 'sonner'
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, List, PlusCircle } from 'lucide-react'
import { TransactionForm } from '@components/inventory/TransactionForm'
import { SuccessCard } from '@components/inventory/transaction-form/SuccessCard'
import { useInventory } from '@hooks/useInventory'

export function AddTransaction() {
  const { transactions } = useInventory()
  const [savedBillNo, setSavedBillNo] = useState<string | null>(null)
  const [formKey, setFormKey] = useState<number>(1)

  const handleSuccess = (billNo: string) => {
    if (!billNo) {
      toast.error('Transaction was created without a bill number.');
      return;
    }
    setSavedBillNo(billNo)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAddAnother = () => {
    setSavedBillNo(null)
    setFormKey((k) => k + 1)
  }

  // Find saved transaction metadata for rich success card summary
  const savedTransaction = useMemo(() => {
    if (!savedBillNo) return null
    return transactions.find((t) => t.bill_number === savedBillNo) || null
  }, [savedBillNo, transactions])

  const savedInward = savedTransaction?.inward_weight || 0
  const savedGodown = savedTransaction?.godown_weight || 0
  const savedTotalWeight =
    savedTransaction?.total_weight !== undefined
      ? savedTransaction.total_weight
      : Math.round((savedInward + savedGodown) * 1000) / 1000
  const savedOutward = savedTransaction?.outward_weight || 0
  const savedDispatchVariance =
    savedTransaction?.dispatch_variance !== undefined
      ? savedTransaction.dispatch_variance
      : Math.round((savedOutward - savedTotalWeight) * 1000) / 1000

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto px-1 sm:px-0 pb-12">
      {/* Top Header Navigation Strip */}
      <div className="space-y-3 mb-6">
        {/* Top meta row: Back Link & Date */}
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <Link
            to="/inventory/list"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-indigo-600 font-medium transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Transactions Ledger</span>
          </Link>
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
            {format(new Date(), 'EEE, dd MMM yyyy')}
          </span>
        </div>

        {/* Title Row */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                <PlusCircle className="h-5 w-5" />
              </div>
              <span>Add Inventory Transaction</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500">
              Inward weighbridge receipt, internal yard loading, and outward dispatch gate clearance
            </p>
          </div>

          <Link
            to="/inventory/list"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 text-xs font-semibold transition shadow-2xs shrink-0 cursor-pointer"
          >
            <List className="h-4 w-4 text-zinc-500" />
            <span className="hidden sm:inline">View Ledger History</span>
            <span className="sm:hidden">History</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area: Success Card or Form */}
      {savedBillNo ? (
        <SuccessCard
          billNumber={savedBillNo}
          transactionDate={
            savedTransaction?.transaction_date
              ? new Date(savedTransaction.transaction_date)
              : new Date()
          }
          partyName={savedTransaction?.parties?.party_name}
          qualityName={savedTransaction?.qualities?.quality_name}
          inwardWeight={savedInward}
          godownWeight={savedGodown}
          totalWeight={savedTotalWeight}
          outwardWeight={savedOutward}
          dispatchVariance={savedDispatchVariance}
          lorryIn={savedTransaction?.vehicles_in?.lorry_number || savedTransaction?.vehicle_in_id}
          lorryOut={savedTransaction?.vehicles_out?.lorry_number || savedTransaction?.vehicle_out_id}
          onAddAnother={handleAddAnother}
        />
      ) : (
        <TransactionForm key={formKey} onSuccess={handleSuccess} />
      )}
    </div>
  )
}

export default AddTransaction
