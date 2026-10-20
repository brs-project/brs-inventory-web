import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowRight, Construction, Layers, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@components/ui/PageHeader'

interface PlaceholderPageProps {
  title: string
  subtitle: string
  category: string
  actionLabel?: string
  actionHref?: string
  icon?: ReactNode
}

export function PlaceholderPage({
  title,
  subtitle,
  category,
  actionLabel = 'New Entry',
  actionHref,
  icon,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          actionHref ? (
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold shadow-md shadow-blue-600/20 transition"
            >
              <Plus className="h-4 w-4" />
              <span>{actionLabel}</span>
            </Link>
          ) : undefined
        }
      />

      {/* Main Feature Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center">
        <div className="h-16 w-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-5 text-blue-600 shadow-sm">
          {icon || <Layers className="h-8 w-8" />}
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">{title} Module</h3>
        <p className="text-sm text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
          {subtitle}. Real-time synchronization and enterprise CRUD workflows for this section are being prepared.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left mb-8">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
              Category
            </span>
            <span className="text-xs font-semibold text-slate-800">{category}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
              Data Model
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Strict TS Ready
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
              Status
            </span>
            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
              <Construction className="h-3.5 w-3.5" /> Scaffolded
            </span>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <span>Return to Dashboard Overview</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

export default PlaceholderPage
