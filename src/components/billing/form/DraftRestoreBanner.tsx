import { Save, X } from 'lucide-react'

export interface DraftRestoreBannerProps {
  onRestore: () => void
  onDiscard: () => void
}

export function DraftRestoreBanner({
  onRestore,
  onDiscard,
}: DraftRestoreBannerProps) {
  return (
    <div className="bg-amber-50 border border-amber-200/90 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in slide-in-from-top-2 duration-200 select-none">
      <div className="flex items-center gap-2.5 text-amber-800">
        <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 shrink-0">
          <Save className="w-4 h-4 text-amber-600" />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-amber-900">
          Unsaved draft found from previous session
        </span>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          type="button"
          onClick={onRestore}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          Restore Draft
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="px-2.5 py-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100/70 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>Discard</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default DraftRestoreBanner
