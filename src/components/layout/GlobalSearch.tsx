import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Package, ArrowRight, Users, Sparkles } from 'lucide-react'
import { useParties, useQualities } from '@hooks/useMasterData'
import { useInventory } from '@hooks/useInventory'

export interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps): React.JSX.Element | null {
  const { parties } = useParties()
  const { qualities } = useQualities()
  const { transactions } = useInventory()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Aggregate results across all datasets
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null

    const matchedParties = parties
      .filter(
        (p) =>
          p.party_name.toLowerCase().includes(q) ||
          p.party_code.toLowerCase().includes(q) ||
          (p.city && p.city.toLowerCase().includes(q))
      )
      .slice(0, 4)

    const matchedTransactions = transactions
      .filter(
        (t) =>
          (t.bill_number && t.bill_number.toLowerCase().includes(q)) ||
          (t.parties && t.parties.party_name.toLowerCase().includes(q)) ||
          (t.qualities && t.qualities.quality_name.toLowerCase().includes(q)) ||
          (t.vehicles_in && t.vehicles_in.lorry_number.toLowerCase().includes(q))
      )
      .slice(0, 4)

    const matchedQualities = qualities
      .filter(
        (ql) =>
          (ql.quality_name || "").toLowerCase().includes(q) ||
          (ql.quality_code || "").toLowerCase().includes(q)
      )
      .slice(0, 4)

    const totalCount =
      matchedParties.length +
      matchedTransactions.length +
      matchedQualities.length

    return {
      parties: matchedParties,
      transactions: matchedTransactions,
      qualities: matchedQualities,
      totalCount,
    }
  }, [query])

  if (!open) return null

  const handleSelect = (url: string) => {
    navigate(url)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search parties, transactions, qualities, vehicles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-slate-200/70 border border-slate-300 font-mono text-[10px] font-bold text-slate-600">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {!results && (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <p className="font-semibold text-slate-500">Quick Search across System Records</p>
              <p className="text-[11px]">Type bill numbers, supplier names, grades, or lorry plates.</p>
            </div>
          )}

          {results && results.totalCount === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <p className="font-bold text-slate-600 text-sm">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-[11px]">Check the spelling or try broader search terms.</p>
            </div>
          )}

          {results && results.totalCount > 0 && (
            <>
              {/* Transactions Section */}
              {results.transactions.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] px-2">
                    <Package className="h-3.5 w-3.5" />
                    <span>Transactions ({results.transactions.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.transactions.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelect(`/inventory/list?search=${t.bill_number || t.parties?.party_name || ''}`)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-blue-600 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200">
                            #{t.bill_number || 'BILL'}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {t.parties?.party_name || 'Party'} &bull; {t.qualities?.quality_name || 'Quality'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Lorry: {t.vehicles_in?.lorry_number || 'N/A'} | Inward: {t.inward_weight.toFixed(3)} MT
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Parties Section */}
              {results.parties.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] px-2">
                    <Users className="h-3.5 w-3.5" />
                    <span>Parties &amp; Suppliers ({results.parties.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.parties.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelect(`/master/parties`)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-slate-700 px-2 py-0.5 rounded-md bg-slate-100">
                            {p.party_code}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.party_name}</span>
                            <span className="text-[11px] text-slate-500">{p.city || 'HQ'}, {p.state || 'India'}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qualities Section */}
              {results.qualities.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px] px-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Qualities &amp; Grades ({results.qualities.length})</span>
                  </div>
                  <div className="space-y-1">
                    {results.qualities.map((ql) => (
                      <button
                        key={ql.id}
                        type="button"
                        onClick={() => handleSelect(`/master/qualities`)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-100 transition text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-purple-700 px-2 py-0.5 rounded-md bg-purple-50">
                            {(ql.quality_code || "")}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{(ql.quality_name || "")}</span>
                            <span className="text-[11px] text-slate-500">{ql.description}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-3">
            <span>Click to select</span>
            <span>&bull;</span>
            <span>ESC to close</span>
          </div>
          <span className="font-bold text-blue-600">BRS Spotlight Search</span>
        </div>
      </div>
    </div>
  )
}

export default GlobalSearch
