import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  itemName: string
  isDeleting?: boolean
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  itemName,
  isDeleting,
}: DeleteConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-200/90 z-50 p-6 sm:p-7 text-center animate-in zoom-in-95 duration-200">
        {/* Warning Icon */}
        <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-2xs">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-2">
          Delete {itemName}?
        </h3>

        <p className="text-xs sm:text-sm text-zinc-500 mb-6 leading-relaxed">
          Are you sure you want to permanently remove this record? This action cannot be undone and will detach associated historical transaction references.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-300 bg-white text-zinc-700 text-xs sm:text-sm font-semibold hover:bg-zinc-50 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs sm:text-sm font-semibold shadow-md shadow-rose-600/25 transition flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Yes, Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmDialog
