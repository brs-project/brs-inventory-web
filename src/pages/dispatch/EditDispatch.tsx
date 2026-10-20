import { formatISTDateTime } from '@lib/dateUtils'
import { useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ChevronRight,
  Home,
  ArrowLeft,
  AlertCircle,
  FileText,
  Clock,
  User,
} from 'lucide-react'
import { PageHeader } from '@components/ui/PageHeader'
import { DispatchEntryForm } from '@components/dispatch/DispatchEntryForm'
import { useDispatch } from '@hooks/useDispatch'

export function EditDispatch() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getDispatchById } = useDispatch()

  const dispatch = useMemo(() => {
    if (!id) return undefined
    return getDispatchById(id)
  }, [id, getDispatchById])

  const handleSuccess = () => {
    navigate('/dispatch/list')
  }

  const handleCancel = () => {
    navigate('/dispatch/list')
  }

  if (!dispatch) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 select-none">
        <div className="p-4 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 inline-block">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Dispatch Record Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          The dispatch record with ID or Bill Number <strong className="font-mono">"{id}"</strong> could not be located. It may have been deleted or archived.
        </p>
        <div className="pt-2">
          <Link
            to="/dispatch/list"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dispatch Sheet</span>
          </Link>
        </div>
      </div>
    )
  }

  const dateObj = new Date(dispatch.dispatch_date)
  const formattedDate = isNaN(dateObj.getTime())
    ? dispatch.dispatch_date
    : format(dateObj, 'EEEE, dd MMMM yyyy')

    const formattedUpdated = formatISTDateTime(dispatch.updated_at)

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center text-xs font-semibold text-slate-500 space-x-1.5"
      >
        <Link
          to="/dashboard"
          className="flex items-center gap-1 hover:text-indigo-600 transition"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link to="/dispatch/list" className="hover:text-indigo-600 transition">
          Dispatch
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-indigo-600 font-bold">
          Edit #{dispatch.dispatch_bill_number}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title={`Edit Dispatch — ${dispatch.dispatch_bill_number}`}
          subtitle={`Modify recorded weight, transporter, lorry registration, or party destination for ${formattedDate}.`}
        />

        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs shrink-0 self-start sm:self-center cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" />
          <span>Cancel &amp; Return</span>
        </button>
      </div>

      {/* Form */}
      <DispatchEntryForm
        key={dispatch.id}
        initialData={dispatch}
        isEdit={true}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />

      {/* Audit Meta Footer */}
      <div className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-400" />
          <span>
            Record ID: <strong className="font-mono text-slate-700">{dispatch.id}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5 text-slate-400" />
            Created by: {dispatch.created_by}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            Last updated: {formattedUpdated}
          </span>
        </div>
      </div>
    </div>
  )
}

export default EditDispatch
