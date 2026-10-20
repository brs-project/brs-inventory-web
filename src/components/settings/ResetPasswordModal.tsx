import { useState } from 'react'
import { X, KeyRound, Mail, Loader2, Send } from 'lucide-react'
import type { UserProfile } from '@types'

export interface ResetPasswordModalProps {
  open: boolean
  onClose: () => void
  user?: UserProfile
  onConfirm: () => Promise<void>
}

export function ResetPasswordModal({
  open,
  onClose,
  user,
  onConfirm,
}: ResetPasswordModalProps) {
  const [isSending, setIsSending] = useState(false)

  if (!open || !user) return null

  const handleSend = async () => {
    setIsSending(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <KeyRound className="h-4 w-4" />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              Reset User Password
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to send a password reset email to{' '}
            <strong className="text-slate-900 font-bold">{user.full_name}</strong>?
          </p>

          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
            <Mail className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <span className="text-[11px] text-blue-600 font-medium block">
                Target Email Address:
              </span>
              <span className="font-bold text-slate-900 text-xs font-mono">
                {user.email || 'user@company.com'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            The recipient will receive an encrypted temporary link valid for 24 hours to securely
            set a new password. Existing active sessions will be terminated upon reset.
          </p>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold transition shadow-md shadow-amber-600/25 cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{isSending ? 'Sending...' : 'Send Reset Email'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordModal
