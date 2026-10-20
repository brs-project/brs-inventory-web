import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Receipt,
  FileText,
} from 'lucide-react'
import { useBill } from '@hooks/useBill'
import { BillEntryForm } from '@components/billing/BillEntryForm'
import { BillSuccessCard } from '@components/billing/BillSuccessCard'
import type { BillEntry } from '@types'

export function AddBillEntry() {
  const { createBillEntry, isSaving } = useBill()
  const [savedEntry, setSavedEntry] = useState<BillEntry | null>(null)
  const [formKey, setFormKey] = useState<number>(1)

  const handleCreateBill = async (
    data: Parameters<typeof createBillEntry>[0]
  ) => {
    try {
      const created = await createBillEntry(data)
      setSavedEntry(created)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      console.error('Submission failed in AddBillEntry:', err)
    }
  }

  const handleAddAnother = () => {
    setSavedEntry(null)
    setFormKey((k) => k + 1)
  }

  return (
    <div className="space-y-4 select-none max-w-6xl mx-auto">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: COMPACT PAGE HEADER & NAVIGATION
          ───────────────────────────────────────────────────────────── */}
      <div>
        {/* Back Link */}
        <Link
          to="/billing/list"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 hover:text-amber-600 transition cursor-pointer mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bill Sheet</span>
        </Link>

        {/* Title Row */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <span>Add Bill Entry</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Record billing rates &amp; calculate RTGS adjustment
            </p>
          </div>

          <Link
            to="/billing/list"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition cursor-pointer shrink-0"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">View Bill Sheet</span>
            <span className="sm:hidden">Sheet</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2 & 7: FORM OR SUCCESS STATE
          ───────────────────────────────────────────────────────────── */}
      {savedEntry ? (
        <BillSuccessCard
          entry={savedEntry}
          onAddAnother={handleAddAnother}
        />
      ) : (
        <BillEntryForm
          key={formKey}
          onSubmit={handleCreateBill}
          onCancel={() => window.history.back()}
          isSubmitting={isSaving}
        />
      )}
    </div>
  )
}

export default AddBillEntry
