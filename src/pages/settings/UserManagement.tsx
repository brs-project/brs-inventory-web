import { useState, useMemo } from 'react'
import {
  UserPlus,
  Pencil,
  KeyRound,
  Trash2,
  Users,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '@components/ui/PageHeader'
import { RoleBadge } from '@components/ui/RoleBadge'
import { AccessDenied } from '@components/auth/AccessDenied'
import { UserFormModal } from '@components/settings/UserFormModal'
import { ResetPasswordModal } from '@components/settings/ResetPasswordModal'
import { DeleteConfirmDialog } from '@components/master/DeleteConfirmDialog'
import { useAuth } from '@hooks/useAuth'
import { useUsers } from '@hooks/useUsers'
import { cn } from '@lib/utils'
import type { UserProfile } from '@types'

const ROLE_AVATAR_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  admin: { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-200' },
  manager: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-200' },
  operator: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-200' },
  viewer: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200' },
  auditor: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-200' },
}

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const {
    users,
    stats,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetPassword,
  } = useUsers()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | undefined>(undefined)

  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [targetResetUser, setTargetResetUser] = useState<UserProfile | undefined>(undefined)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [targetDeleteUser, setTargetDeleteUser] = useState<UserProfile | undefined>(undefined)
  const [isDeleting, setIsDeleting] = useState(false)

  // Security Guard: Admin only
  const isAdmin = currentUser?.role === 'admin'
  if (!isAdmin) {
    return <AccessDenied />
  }

  // Filter users by search and role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchName = u.full_name.toLowerCase().includes(q)
        const matchEmail = u.email?.toLowerCase().includes(q)
        const matchPhone = u.phone?.includes(q)
        if (!matchName && !matchEmail && !matchPhone) return false
      }

      return true
    })
  }, [users, searchTerm, roleFilter])

  const getInitials = (name: string): string => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const formatRelativeLogin = (isoString?: string): string => {
    if (!isoString) return 'Never signed in'
    try {
      const date = new Date(isoString)
      const diffMs = Date.now() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      const diffDays = Math.floor(diffHours / 24)
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      return `${Math.floor(diffDays / 30)} month(s) ago`
    } catch {
      return 'Recently'
    }
  }

  const handleOpenAdd = () => {
    setEditingUser(undefined)
    setFormModalOpen(true)
  }

  const handleOpenEdit = (u: UserProfile) => {
    setEditingUser(u)
    setFormModalOpen(true)
  }

  const handleOpenReset = (u: UserProfile) => {
    setTargetResetUser(u)
    setResetModalOpen(true)
  }

  const handleOpenDelete = (u: UserProfile) => {
    setTargetDeleteUser(u)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!targetDeleteUser) return
    setIsDeleting(true)
    try {
      await deleteUser(targetDeleteUser.id)
      setDeleteDialogOpen(false)
      setTargetDeleteUser(undefined)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 select-none">
      {/* Page Header with Add User Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="User Management"
          subtitle="Manage administrative operators, access roles, security credentials, and active system logins."
        />

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 transition cursor-pointer self-start sm:self-center shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Summary Stats Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Stats Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 font-bold">
            <Users className="h-4 w-4 text-blue-400" />
            <span>Total: {stats.totalCount} Users</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{stats.activeCount} Active</span>
          </div>
          {stats.inactiveCount > 0 && (
            <div className="flex items-center gap-1 text-rose-400 font-semibold">
              <XCircle className="h-3.5 w-3.5" />
              <span>{stats.inactiveCount} Inactive</span>
            </div>
          )}
        </div>

        {/* Right Role Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 hidden lg:inline">
            By Role:
          </span>
          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold text-[11px] border border-rose-500/30">
            Admin ({stats.roleCounts.admin})
          </span>
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-500/30">
            Manager ({stats.roleCounts.manager})
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-[11px] border border-blue-500/30">
            Operator ({stats.roleCounts.operator})
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-300 font-bold text-[11px] border border-slate-500/30">
            Viewer ({stats.roleCounts.viewer})
          </span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
            Auditor ({stats.roleCounts.auditor})
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-bold text-slate-500">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles ({users.length})</option>
            <option value="admin">Administrators ({stats.roleCounts.admin})</option>
            <option value="manager">Managers ({stats.roleCounts.manager})</option>
            <option value="operator">Operators ({stats.roleCounts.operator})</option>
            <option value="viewer">Viewers ({stats.roleCounts.viewer})</option>
            <option value="auditor">Auditors ({stats.roleCounts.auditor})</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-3 py-3.5 text-center w-12">#</th>
                <th className="px-3.5 py-3.5">User Profile</th>
                <th className="px-3.5 py-3.5">Email Address</th>
                <th className="px-3.5 py-3.5">Phone</th>
                <th className="px-3.5 py-3.5 text-center">Role</th>
                <th className="px-3.5 py-3.5 text-center">Status</th>
                <th className="px-3.5 py-3.5 text-right">Last Login</th>
                <th className="px-4 py-3.5 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u, index) => {
                  const avatarColor = ROLE_AVATAR_COLORS[u.role] || ROLE_AVATAR_COLORS.operator
                  const isCurrent = currentUser?.id === u.id

                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        'hover:bg-blue-50/50 transition-colors',
                        !u.is_active && 'bg-slate-50/50 opacity-75'
                      )}
                    >
                      {/* # Index */}
                      <td className="px-3 py-3 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>

                      {/* Avatar + Full Name */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'h-9 w-9 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ring-2',
                              avatarColor.bg,
                              avatarColor.text,
                              avatarColor.ring
                            )}
                          >
                            {getInitials(u.full_name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 block text-xs">
                                {u.full_name}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-extrabold text-[9px] uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {u.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-3.5 py-3 font-medium text-slate-700">
                        {u.email || '—'}
                      </td>

                      {/* Phone */}
                      <td className="px-3.5 py-3 font-mono text-slate-600">
                        {u.phone || '—'}
                      </td>

                      {/* Role */}
                      <td className="px-3.5 py-3 text-center">
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Status Toggle */}
                      <td className="px-3.5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer',
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          )}
                          title="Click to toggle active status"
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              u.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            )}
                          />
                          <span>{u.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="px-3.5 py-3 text-right text-slate-500 font-medium text-[11px]">
                        {formatRelativeLogin(u.last_login)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit User Details"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenReset(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Send Password Reset Email"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(u)}
                            disabled={isCurrent}
                            className={cn(
                              'p-1.5 rounded-lg transition cursor-pointer',
                              isCurrent
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            )}
                            title={isCurrent ? 'Cannot delete logged-in account' : 'Delete User'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No users match your search or role criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal (Create / Edit) */}
      <UserFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        user={editingUser}
        onSave={async (data) => {
          if (editingUser) {
            await updateUser(editingUser.id, data)
          } else {
            await addUser(data)
          }
        }}
      />

      {/* Reset Password Confirmation Modal */}
      <ResetPasswordModal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        user={targetResetUser}
        onConfirm={async () => {
          if (targetResetUser) {
            await resetPassword(targetResetUser.id)
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={targetDeleteUser?.full_name || 'User'}
        isDeleting={isDeleting}
      />
    </div>
  )
}

export default UserManagement
