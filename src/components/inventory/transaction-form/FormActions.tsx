import { RotateCcw, Save, Send, Loader2 } from 'lucide-react'

export interface FormActionsProps {
  isSaving: boolean
  isEditing?: boolean
  onClear: () => void
  onSaveDraft: () => void
  onSaveCompleted: () => void
}

export function FormActions({
  isSaving,
  isEditing = false,
  onClear,
  onSaveDraft,
  onSaveCompleted,
}: FormActionsProps) {
  return (
    <>
      {/* Desktop / Tablet Inline Action Bar (bottom of left column) */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
        {/* Left: Clear Form */}
        <button
          type="button"
          disabled={isSaving}
          onClick={onClear}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs sm:text-sm font-medium transition cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Clear Form</span>
        </button>

        {/* Right: Draft & Submit */}
        <div className="w-full sm:w-auto flex items-center gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveDraft}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-amber-300 bg-white text-amber-700 hover:bg-amber-50 hover:border-amber-400 text-xs sm:text-sm font-semibold transition cursor-pointer disabled:opacity-60 shadow-2xs"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
            ) : (
              <Save className="h-4 w-4 text-amber-600" />
            )}
            <span>{isEditing ? 'Save Draft Changes' : 'Save as Draft'}</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveCompleted}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm shadow-blue-600/20 transition cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>{isEditing ? 'Updating...' : 'Submitting...'}</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>{isEditing ? 'Update Transaction' : 'Save & Submit'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar (< lg) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-4 py-3 shadow-lg flex items-center gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={onSaveDraft}
          className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold transition cursor-pointer disabled:opacity-60"
        >
          <Save className="h-4 w-4 text-amber-700" />
          <span>Save Draft</span>
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={onSaveCompleted}
          className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-sm transition cursor-pointer disabled:opacity-60"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>{isEditing ? 'Update' : 'Submit'}</span>
        </button>
      </div>
    </>
  )
}

export default FormActions
