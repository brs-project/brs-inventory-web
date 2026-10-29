import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  UserPlus,
  Search,
  Trash2,
  Shield,
  Phone,
  Mail,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@hooks/useAuth'
import { cn } from '@lib/utils'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import {
  fetchUsers,
  createUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  type UserProfileItem,
  type UserRole,
} from '@/services/userService'

const ROLES: { id: UserRole; name: string; scope: string; badgeClass: string; guidance: string }[] = [
  {
    id: 'ADMIN',
    name: 'ADMIN',
    scope: 'Full Control',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    guidance: 'Full Control: Access all system modules, global configurations, security settings, user roles, and weighbridge workflows.',
  },
  {
    id: 'MANAGER',
    name: 'MANAGER',
    scope: 'Yard & Commercial Ops',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
    guidance: 'Yard & Commercial Ops: Full access to weighments, godown chits, outward dispatches, billing settlements, and analytical reports.',
  },
  {
    id: 'OPERATOR',
    name: 'OPERATOR',
    scope: 'Weighbridge & Inward Only',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    guidance: 'Weighbridge & Inward Only: Restricted to live weighbridge scale capturing, gross/tare recordings, and inward chits.',
  },
  {
    id: 'VIEWER',
    name: 'VIEWER',
    scope: 'Read-Only Auditor',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    guidance: 'Read-Only Auditor: Read-only visibility to transaction logs, dispatch sheets, and audit reports without editing capabilities.',
  },
]

const ROLE_MAP = ROLES.reduce(
  (acc, r) => {
    acc[r.id] = r
    return acc
  },
  {} as Record<UserRole, (typeof ROLES)[number]>
)

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserProfileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'ALL' | UserRole>('ALL')

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addRole, setAddRole] = useState<UserRole>('OPERATOR')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({})

  // Delete User Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<UserProfileItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load Users from Supabase / UserService
  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err: any) {
      toast.error('Failed to load user accounts', {
        description: err.message || 'Please check network connection',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Filter Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRoleFilter !== 'ALL' && u.role !== selectedRoleFilter) {
        return false
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchesName = u.full_name.toLowerCase().includes(q)
        const matchesEmail = u.email.toLowerCase().includes(q)
        const matchesPhone = u.phone ? u.phone.toLowerCase().includes(q) : false
        return matchesName || matchesEmail || matchesPhone
      }
      return true
    })
  }, [users, searchTerm, selectedRoleFilter])

  // Check if target user is current signed-in user (self-lockout prevention)
  const isCurrentSignedInUser = useCallback(
    (targetUser: UserProfileItem) => {
      if (!currentUser) return false
      // Match either by ID or email
      if (currentUser.id && targetUser.id === currentUser.id) return true
      if (currentUser.email && targetUser.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return true
      }
      return false
    },
    [currentUser]
  )

  // Handle Role Change
  const handleRoleChange = async (targetUser: UserProfileItem, newRole: UserRole) => {
    if (isCurrentSignedInUser(targetUser) && newRole !== 'ADMIN') {
      toast.error('Self-lockout prevented', {
        description: 'You cannot demote or alter your own administrative role.',
      })
      return
    }

    try {
      await updateUserRole(targetUser.id, newRole, currentUser?.id)
      toast.success(`Role updated for ${targetUser.full_name}`, {
        description: `New security role: ${newRole}`,
      })
      await loadUsers()
    } catch (err: any) {
      toast.error('Failed to update role', {
        description: err.message || 'An unexpected error occurred',
      })
    }
  }

  // Handle Status Toggle
  const handleStatusToggle = async (targetUser: UserProfileItem) => {
    if (isCurrentSignedInUser(targetUser) && targetUser.is_active) {
      toast.error('Self-lockout prevented', {
        description: 'You cannot deactivate your own active user account.',
      })
      return
    }

    const nextStatus = !targetUser.is_active
    try {
      await toggleUserStatus(targetUser.id, nextStatus, currentUser?.id)
      toast.success(
        nextStatus
          ? `${targetUser.full_name} is now Active`
          : `${targetUser.full_name} has been Deactivated`
      )
      await loadUsers()
    } catch (err: any) {
      toast.error('Failed to change status', {
        description: err.message || 'An unexpected error occurred',
      })
    }
  }

  // Handle Delete Confirmation
  const confirmDelete = async () => {
    if (!userToDelete) return
    if (isCurrentSignedInUser(userToDelete)) {
      toast.error('Self-lockout prevented', {
        description: 'You cannot delete your own account.',
      })
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      return
    }

    setIsDeleting(true)
    try {
      await deleteUser(userToDelete.id, currentUser?.id)
      toast.success(`User ${userToDelete.full_name} removed successfully`)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      await loadUsers()
    } catch (err: any) {
      toast.error('Failed to remove user', {
        description: err.message || 'An unexpected error occurred',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Form Validation & Submit for Add User Modal
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: { name?: string; email?: string } = {}

    if (!addName.trim()) {
      errors.name = 'Full name is required'
    }

    const emailTrimmed = addEmail.trim().toLowerCase()
    if (!emailTrimmed) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      errors.email = 'Please enter a valid email address'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    setIsSubmitting(true)

    try {
      await createUser({
        full_name: addName.trim(),
        email: emailTrimmed,
        phone: addPhone.trim() || null,
        role: addRole,
      })

      toast.success('User account created successfully', {
        description: `${addName} has been assigned the ${addRole} role.`,
      })

      // Reset and close
      setAddName('')
      setAddEmail('')
      setAddPhone('')
      setAddRole('OPERATOR')
      setIsAddModalOpen(false)
      await loadUsers()
    } catch (err: any) {
      toast.error('Failed to create user', {
        description: err.message || 'An unexpected error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string): string => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-zinc-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
            User Management & Staff Access
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage operator accounts, assign security roles, and control access permissions
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormErrors({})
            setIsAddModalOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Add New User</span>
        </button>
      </div>

      {/* 2. TOP FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search operator by name, email or phone..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Quick Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {(['ALL', 'ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER'] as const).map((roleKey) => (
            <button
              key={roleKey}
              type="button"
              onClick={() => setSelectedRoleFilter(roleKey)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer shrink-0',
                selectedRoleFilter === roleKey
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              )}
            >
              {roleKey}
            </button>
          ))}
        </div>
      </div>

      {/* 3. USER LIST TABLE */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading user profiles from Supabase...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              No matching user accounts
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
              {searchTerm
                ? `No accounts found matching "${searchTerm}". Try a different keyword.`
                : 'No users have been registered under this role filter.'}
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Clear search filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">User Details</th>
                  <th className="py-3.5 px-4">Role & Security Scope</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-sans">
                {filteredUsers.map((userItem) => {
                  const isSelf = isCurrentSignedInUser(userItem)
                  const roleConfig = ROLE_MAP[userItem.role] || ROLE_MAP.VIEWER

                  return (
                    <tr
                      key={userItem.id}
                      className={cn(
                        'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors',
                        !userItem.is_active && 'opacity-60 bg-zinc-50/40 dark:bg-zinc-950/40'
                      )}
                    >
                      {/* Column 1: User Details */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-zinc-900 shrink-0 shadow-2xs font-mono',
                              userItem.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                                : userItem.role === 'MANAGER'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                                : userItem.role === 'OPERATOR'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            )}
                          >
                            {getInitials(userItem.full_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {userItem.full_name}
                              </span>
                              {isSelf && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-sm text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                              <span className="flex items-center gap-1 truncate">
                                <Mail className="h-3 w-3 text-zinc-400 shrink-0" />
                                {userItem.email}
                              </span>
                              {userItem.phone && (
                                <span className="flex items-center gap-1 truncate font-mono text-[11px]">
                                  <Phone className="h-3 w-3 text-zinc-400 shrink-0" />
                                  {userItem.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Role Badge & Description */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border',
                              roleConfig.badgeClass
                            )}
                          >
                            {roleConfig.name}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium leading-none">
                            {roleConfig.scope}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Status Toggle */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={userItem.is_active}
                            disabled={isSelf}
                            onClick={() => handleStatusToggle(userItem)}
                            title={
                              isSelf
                                ? 'Self-lockout guard: You cannot deactivate your own account'
                                : userItem.is_active
                                ? 'Click to deactivate'
                                : 'Click to activate'
                            }
                            className={cn(
                              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-500/20',
                              userItem.is_active ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700',
                              isSelf && 'cursor-not-allowed opacity-50'
                            )}
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                                userItem.is_active ? 'translate-x-4' : 'translate-x-0'
                              )}
                            />
                          </button>
                          <span
                            className={cn(
                              'text-[10px] font-semibold uppercase tracking-wider',
                              userItem.is_active
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-zinc-400 dark:text-zinc-500'
                            )}
                          >
                            {userItem.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Actions (Change Role + Delete) */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-2.5">
                          {/* Change Role Dropdown */}
                          <div className="relative">
                            <select
                              value={userItem.role}
                              disabled={isSelf}
                              onChange={(e) =>
                                handleRoleChange(userItem, e.target.value as UserRole)
                              }
                              title={
                                isSelf
                                  ? 'Self-lockout guard: You cannot change or demote your own administrative role'
                                  : 'Assign new security role'
                              }
                              className={cn(
                                'h-8 px-2.5 pr-7 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors',
                                isSelf && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="MANAGER">MANAGER</option>
                              <option value="OPERATOR">OPERATOR</option>
                              <option value="VIEWER">VIEWER</option>
                            </select>
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => {
                              setUserToDelete(userItem)
                              setDeleteDialogOpen(true)
                            }}
                            title={
                              isSelf
                                ? 'Self-lockout guard: You cannot delete your own account'
                                : 'Delete user profile'
                            }
                            className={cn(
                              'h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-colors cursor-pointer',
                              isSelf && 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-zinc-400 hover:border-transparent'
                            )}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. ADD NEW USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => !isSubmitting && setIsAddModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Add New User Account
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Register an operator account and assign security role
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  className={cn(
                    'w-full px-3.5 py-2.5 text-sm rounded-lg border bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 transition-all',
                    formErrors.name
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500/20 focus:border-blue-500'
                  )}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="e.g. anand@brs-steel.com"
                  className={cn(
                    'w-full px-3.5 py-2.5 text-sm rounded-lg border bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 transition-all',
                    formErrors.email
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500/20 focus:border-blue-500'
                  )}
                />
                {formErrors.email && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Official Phone <span className="text-zinc-400 text-[10px] lowercase">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="e.g. +91 98220 12345"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono"
                />
              </div>

              {/* Security Role Dropdown */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Security Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                >
                  <option value="ADMIN">ADMIN — Full Control</option>
                  <option value="MANAGER">MANAGER — Yard & Commercial Ops</option>
                  <option value="OPERATOR">OPERATOR — Weighbridge & Inward Only</option>
                  <option value="VIEWER">VIEWER — Read-Only Auditor</option>
                </select>

                {/* Role Guidance Description Box */}
                <div className="mt-2.5 p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/80">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {ROLE_MAP[addRole].name}:
                      </span>{' '}
                      {ROLE_MAP[addRole].guidance}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800 mt-6">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <span>Create User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CONFIRMATION DIALOG */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setUserToDelete(null)
        }}
        onConfirm={confirmDelete}
        itemName={userToDelete ? `User "${userToDelete.full_name}"` : 'User'}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default UserManagement
