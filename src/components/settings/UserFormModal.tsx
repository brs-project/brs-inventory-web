import { useState, useEffect } from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react'
import { cn } from '@lib/utils'
import type { UserProfile } from '@types'
import type { UserInput } from '@hooks/useUsers'

export interface UserFormModalProps {
  open: boolean
  onClose: () => void
  user?: UserProfile
  onSave: (data: UserInput) => Promise<void>
}

const ROLE_DESCRIPTIONS: Record<string, { label: string; desc: string; badgeColor: string }> = {
  admin: {
    label: 'Administrator',
    desc: 'Full unrestricted access including user administration, security policies, and permanent deletion operations.',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  manager: {
    label: 'Operations Manager',
    desc: 'Full CRUD access to inventory transactions and master data. Can generate and export all analytical reports.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  operator: {
    label: 'Weighbridge Operator',
    desc: 'Can create and modify weighbridge transactions, view inventory stock, and inspect master data.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  viewer: {
    label: 'Read-Only Viewer',
    desc: 'Read-only visibility across dashboards and inventory transactions with no editing privileges.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  auditor: {
    label: 'Financial / Stock Auditor',
    desc: 'Read-only access with full ledger inspection and high-resolution export capabilities.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
}

export function UserFormModal({
  open,
  onClose,
  user,
  onSave,
}: UserFormModalProps) {
  const isEditing = Boolean(user)

  // Form State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<'admin' | 'manager' | 'operator' | 'viewer' | 'auditor'>('operator')
  const [isActive, setIsActive] = useState(true)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [mustChangePassword, setMustChangePassword] = useState(true)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill on edit or reset on create
  useEffect(() => {
    if (user) {
      setFullName(user.full_name)
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setRole(user.role)
      setIsActive(user.is_active)
      setPassword('')
      setPasswordConfirm('')
      setErrors({})
    } else {
      setFullName('')
      setEmail('')
      setPhone('')
      setRole('operator')
      setIsActive(true)
      setPassword('')
      setPasswordConfirm('')
      setMustChangePassword(true)
      setErrors({})
    }
  }, [user, open])

  if (!open) return null

  // Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {}

    if (!fullName.trim() || fullName.trim().length < 3) {
      errs.fullName = 'Full name must be at least 3 characters long.'
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please provide a valid email format.'
    }

    if (phone && !/^\+?[0-9\s-]{10,14}$/.test(phone.trim())) {
      errs.phone = 'Please enter a valid 10-digit phone number.'
    }

    if (!isEditing) {
      if (!password) {
        errs.password = 'Temporary password is required for new accounts.'
      } else if (password.length < 8) {
        errs.password = 'Password must be at least 8 characters.'
      } else if (!/[A-Z]/.test(password)) {
        errs.password = 'Password must contain at least 1 uppercase letter.'
      } else if (!/[0-9]/.test(password)) {
        errs.password = 'Password must contain at least 1 number.'
      }

      if (password !== passwordConfirm) {
        errs.passwordConfirm = 'Passwords do not match.'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSave({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        is_active: isActive,
        password: password || undefined,
        password_confirm: passwordConfirm || undefined,
        must_change_password: mustChangePassword,
      })
      onClose()
    } catch {
      // Handled by hook toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                {isEditing ? `Edit User — ${user?.full_name}` : 'Create New System User'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {isEditing ? 'Modify user account credentials and role assignments' : 'Provision a new authenticated user profile'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={cn(
                    'w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
                    errors.fullName ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                  )}
                />
              </div>
              {errors.fullName && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    'w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
                    errors.email ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Phone & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(
                    'w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
                    errors.phone ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                  )}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Access Role <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Shield className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="manager">Operations Manager (CRUD &amp; Reports)</option>
                  <option value="operator">Weighbridge Operator (Data Entry)</option>
                  <option value="viewer">Viewer (Read-Only)</option>
                  <option value="auditor">Stock Auditor (Audit &amp; Export)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Role Description Card */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800">
                {ROLE_DESCRIPTIONS[role]?.label}:
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {ROLE_DESCRIPTIONS[role]?.desc}
              </p>
            </div>
          </div>

          {/* Password Row (New User Only) */}
          {!isEditing && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Temporary Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="Min. 8 chars (1 uppercase, 1 number)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        'w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
                        errors.password ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                      )}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="Re-type password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className={cn(
                        'w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
                        errors.passwordConfirm ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300 bg-white'
                      )}
                    />
                  </div>
                  {errors.passwordConfirm && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.passwordConfirm}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-600">
                <input
                  type="checkbox"
                  checked={mustChangePassword}
                  onChange={(e) => setMustChangePassword(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-semibold text-slate-700">
                  Require password change on first sign-in
                </span>
              </label>
            </div>
          )}

          {/* Account Status Toggle */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Account Active Status</span>
              <span className="text-[11px] text-slate-500">
                Active users can authenticate and access authorized screens
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold transition shadow-md shadow-blue-600/25 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserFormModal
