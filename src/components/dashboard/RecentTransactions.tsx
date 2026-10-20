import { Link } from 'react-router-dom'
import { Inbox, ArrowRight } from 'lucide-react'
import { formatDate, formatWeight, getStatusColor, cn } from '@lib/utils'
export interface RecentTransactionItem {
  id: string
  date: string
  party: string
  quality: string
  lorryNumber: string
  weight: number
  type: 'Inward' | 'Outward'
  status: 'Completed' | 'Pending' | 'Draft'
  lorry_in?: string
  inward?: number
  lorry_out?: string
  outward?: number
}

interface RecentTransactionsProps {
  transactions: RecentTransactionItem[]
  isLoading?: boolean
}

export function RecentTransactions({ transactions, isLoading }: RecentTransactionsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm animate-pulse space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const displayedTransactions = transactions.slice(0, 5)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden select-none">
      {/* Header */}
      <div className="p-5 sm:px-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Transactions</h2>
          <p className="text-xs text-slate-500 mt-0.5">Latest weighbridge entries &amp; dispatches</p>
        </div>
        <Link
          to="/inventory/list"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Table / Empty State */}
      {displayedTransactions.length === 0 ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
          <Inbox className="h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">No recent transactions found</p>
          <p className="text-xs text-slate-400">Transactions registered today will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 pl-6">Date</th>
                <th className="py-3.5 px-4">Party</th>
                <th className="py-3.5 px-4">Quality</th>
                <th className="py-3.5 px-4">Lorry In</th>
                <th className="py-3.5 px-4 text-right">Inward MT</th>
                <th className="py-3.5 px-4">Lorry Out</th>
                <th className="py-3.5 px-4 text-right">Outward MT</th>
                <th className="py-3.5 px-4 pr-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="hover:bg-blue-50/40 transition duration-150 ease-in-out cursor-default"
                >
                  <td className="py-3.5 px-4 pl-6 font-medium text-slate-600">
                    {formatDate(txn.date)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{txn.party}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                      {txn.quality}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                    {txn.lorry_in || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600">
                    {(txn.inward || 0) > 0 ? formatWeight(txn.inward || 0) : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                    {txn.lorry_out || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-red-600">
                    {(txn.outward || 0) > 0 ? formatWeight(txn.outward || 0) : '—'}
                  </td>
                  <td className="py-3.5 px-4 pr-6 text-center">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                        getStatusColor(txn.status)
                      )}
                    >
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default RecentTransactions
