import { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  KeyRound,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@hooks/useAuth'
import { useAuthStore } from '@store/authStore'
import { RoleBadge } from '@components/ui/RoleBadge'
import { supabase } from '@/services/supabaseClient'
import {
  fetchUserProfile,
  updateUserProfile,
  type UserRole,
} from '@/services/userService'

const PRIVILEGES_BY_ROLE: Record<UserRole, { title: string; items: string[] }> = {
  ADMIN: {
    title: 'Full Administrator Privileges',
    items: [
      'Full administrative access across all operational modules',
      'Manage staff user accounts, role permissions, and access status',
      'Configure yard operational rules and weighbridge scale tolerances',
      'Full create, edit, and delete permissions on inventory and dispatch records',
      'Commercial billing settlement, rate difference management, and ledger audits',
    ],
  },
  MANAGER: {
    title: 'Yard & Commercial Operations Scope',
    items: [
      'Full access to weighment logs, godown chits, and outward dispatch sheets',
      'Manage party master records and transporter directory',
      'Record commercial billing settlements and rate differences',
      'Access real-time inventory and Sauda turnover analytics',
      'Supervisor tare weight override authorization',
    ],
  },
  OPERATOR: {
    title: 'Weighbridge & Inward Operations Scope',
    items: [
      'Live weighbridge computerized gross and tare weight capture',
      'Generate inward weight receipts and outward godown chits',
      'Search and verify registered vehicles and transport haulers',
      'Restricted from user management, role assignments, and global settings',
      'Restricted from financial rate alterations and invoice adjustments',
    ],
  },
  VIEWER: {
    title: 'Read-Only Auditor Scope',
    items: [
      'Read-only visibility into inward/outward weighment history',
      'Access dispatch sheets, billing summaries, and Sauda rate reports',
      'Inspect computerized weight receipts and rate difference statements',
      'Restricted from creating, editing, or deleting any yard transactions',
    ],
  },
}

export function MyProfile() {
  const { user } = useAuth()
  const setUser = useAuthStore((s) => s.setUser)

  const [loading, setLoading] = useState(true)
  const [profileId, setProfileId] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [role, setRole] = useState<UserRole>('ADMIN')
  const [isSavingInfo, setIsSavingInfo] = useState(false)

  // Security / Password update state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // Load fresh profile from database
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const identifier = user?.id || user?.email || '1'
        const dbProfile = await fetchUserProfile(identifier)
        if (dbProfile) {
          setProfileId(dbProfile.id)
          setFullName(dbProfile.full_name)
          setEmail(dbProfile.email)
          setPhone(dbProfile.phone || '')
          setRole(dbProfile.role)
        } else {
          // Fallback to store auth user
          setProfileId(user?.id || 'default')
          setFullName(user?.full_name || 'Admin User')
          setEmail(user?.email || 'admin@brsmetals.com')
          setPhone(user?.phone || '')
          setRole(
            user?.role ? (user.role.toUpperCase() as UserRole) : 'ADMIN'
          )
        }
      } catch (err: any) {
        console.error('Error loading profile:', err)
        setFullName(user?.full_name || 'Admin User')
        setEmail(user?.email || 'admin@brsmetals.com')
        setPhone(user?.phone || '')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  // Save Personal Info
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Full Name is required')
      return
    }

    setIsSavingInfo(true)
    try {
      if (profileId && profileId !== 'default') {
        const updated = await updateUserProfile(profileId, {
          full_name: fullName,
          phone: phone,
        })
        setFullName(updated.full_name)
        setPhone(updated.phone || '')
      }

      // Update local auth store so Topbar reflects changes immediately
      if (user) {
        setUser({
          ...user,
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
        })
      }

      toast.success('Personal details updated successfully')
    } catch (err: any) {
      console.error('Error saving profile:', err)
      toast.error('Failed to update personal details', {
        description: err.message || 'Please check your connection',
      })
    } finally {
      setIsSavingInfo(false)
    }
  }

  // Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New Password and Confirm Password do not match')
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error('Error updating password:', err)
      toast.error('Failed to update password', {
        description: err.message || 'Please check authentication credentials',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const rolePrivileges = PRIVILEGES_BY_ROLE[role] || PRIVILEGES_BY_ROLE.ADMIN

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
        <p className="text-xs font-semibold">Loading profile details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              My Account & Profile
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Personal account credentials and security settings
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* =====================================================================
            CARD 1: PERSONAL DETAILS
        ===================================================================== */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2.5 bg-zinc-50/50 dark:bg-zinc-800/20">
              <User className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Personal Details
              </h2>
            </div>

            <form onSubmit={handleSaveInfo} id="personal-info-form" className="p-5 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Email Address (Read-Only) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Email Address (Primary Identity)
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    readOnly
                    disabled
                    value={email}
                    className="w-full pl-9 pr-8 py-2 text-xs font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 cursor-not-allowed select-all"
                  />
                  <Lock className="h-3.5 w-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Email is locked to your organization account identifier.
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98200 12345"
                    className="w-full pl-9 pr-3.5 py-2 text-xs font-mono font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </form>
          </div>

          <div className="p-5 pt-0">
            <button
              type="submit"
              form="personal-info-form"
              disabled={isSavingInfo}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isSavingInfo ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Personal Info</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* =====================================================================
            CARD 2: ROLE & ACCESS SCOPE
        ===================================================================== */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20">
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-purple-600" />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Role & Access Scope
                </h2>
              </div>
              <RoleBadge role={role.toLowerCase() as any} />
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Assigned Security Clearance
                </span>
                <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  {rolePrivileges.title}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  System Permissions Granted:
                </span>
                <ul className="space-y-2">
                  {rolePrivileges.items.map((privilege, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      <span>{privilege}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="p-5 pt-0">
            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/60 text-[11px] text-zinc-500">
              Role permissions are managed centrally by System Administrators under{' '}
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                User Management
              </span>
              .
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CARD 3: SECURITY & AUTHENTICATION (PASSWORD UPDATE)
      ========================================================================= */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2.5 bg-zinc-50/50 dark:bg-zinc-800/20">
          <KeyRound className="h-4 w-4 text-emerald-600" />
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Security & Authentication
            </h2>
            <p className="text-[11px] text-zinc-400">
              Update your account password across computerized devices
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="p-5 space-y-4 max-w-lg">
          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-3.5 py-2 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MyProfile

