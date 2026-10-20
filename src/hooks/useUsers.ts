import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@hooks/useAuth'
import type { UserProfile } from '@types'

const LOCAL_STORAGE_USERS_KEY = 'inventory_system_users_v1'

export interface UserInput {
  full_name: string
  email: string
  phone?: string
  role: 'admin' | 'manager' | 'operator' | 'viewer' | 'auditor'
  is_active: boolean
  password?: string
  password_confirm?: string
  must_change_password?: boolean
}

// Initial session state
function getInitialUsers(): UserProfile[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_USERS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Error loading users from localStorage:', err)
  }
  return [
    {
      id: 'usr-admin-1',
      full_name: 'Administrator',
      email: 'admin@brsmetals.com',
      phone: '+91 98200 12345',
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString(),
    }
  ]
}

export function useUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>(getInitialUsers)
  const [isLoading, setIsLoading] = useState(false)

  const persist = useCallback((updated: UserProfile[]) => {
    setUsers(updated)
    try {
      localStorage.setItem(LOCAL_STORAGE_USERS_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error('Failed to save users to localStorage:', err)
    }
  }, [])

  // Summary Metrics
  const stats = useMemo(() => {
    const totalCount = users.length
    const activeCount = users.filter((u) => u.is_active).length
    const inactiveCount = totalCount - activeCount

    const roleCounts = users.reduce(
      (acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalCount,
      activeCount,
      inactiveCount,
      roleCounts: {
        admin: roleCounts['admin'] || 0,
        manager: roleCounts['manager'] || 0,
        operator: roleCounts['operator'] || 0,
        viewer: roleCounts['viewer'] || 0,
        auditor: roleCounts['auditor'] || 0,
      },
    }
  }, [users])

  // 1. Add User
  const addUser = async (data: UserInput): Promise<UserProfile> => {
    setIsLoading(true)

    return new Promise<UserProfile>((resolve, reject) => {
      setTimeout(() => {
        try {
          const emailLower = data.email.trim().toLowerCase()

          // Check email uniqueness
          const exists = users.some((u) => u.email?.toLowerCase() === emailLower)
          if (exists) {
            throw new Error(`A user with email "${data.email}" already exists.`)
          }

          if (data.full_name.trim().length < 3) {
            throw new Error('Full name must be at least 3 characters long.')
          }

          const newUser: UserProfile = {
            id: `USR-${Date.now()}`,
            full_name: data.full_name.trim(),
            email: emailLower,
            phone: data.phone?.trim() || undefined,
            role: data.role,
            is_active: data.is_active,
            created_at: new Date().toISOString(),
            last_login: undefined,
          }

          const updated = [newUser, ...users]
          persist(updated)
          setIsLoading(false)
          toast.success(`User "${newUser.full_name}" created successfully!`)
          resolve(newUser)
        } catch (err: unknown) {
          setIsLoading(false)
          const msg = err instanceof Error ? err.message : 'Failed to create user'
          toast.error(msg)
          reject(err)
        }
      }, 500)
    })
  }

  // 2. Update User
  const updateUser = async (id: string, data: Partial<UserInput>): Promise<UserProfile> => {
    setIsLoading(true)

    return new Promise<UserProfile>((resolve, reject) => {
      setTimeout(() => {
        try {
          const index = users.findIndex((u) => u.id === id)
          if (index === -1) {
            throw new Error(`User with ID ${id} not found.`)
          }

          const existing = users[index]

          if (data.email) {
            const emailLower = data.email.trim().toLowerCase()
            const exists = users.some(
              (u) => u.id !== id && u.email?.toLowerCase() === emailLower
            )
            if (exists) {
              throw new Error(`Another user with email "${data.email}" already exists.`)
            }
          }

          // Guard: Cannot demote or deactivate the last remaining admin
          if (existing.role === 'admin' && (data.role && data.role !== 'admin' || data.is_active === false)) {
            const adminCount = users.filter((u) => u.role === 'admin' && u.is_active).length
            if (adminCount <= 1) {
              throw new Error('Cannot demote or deactivate the sole remaining active Administrator.')
            }
          }

          const updatedUser: UserProfile = {
            ...existing,
            full_name: data.full_name ? data.full_name.trim() : existing.full_name,
            email: data.email ? data.email.trim().toLowerCase() : existing.email,
            phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
            role: data.role || existing.role,
            is_active: data.is_active !== undefined ? data.is_active : existing.is_active,
          }

          const updated = [...users.slice(0, index), updatedUser, ...users.slice(index + 1)]
          persist(updated)
          setIsLoading(false)
          toast.success(`User "${updatedUser.full_name}" updated successfully!`)
          resolve(updatedUser)
        } catch (err: unknown) {
          setIsLoading(false)
          const msg = err instanceof Error ? err.message : 'Failed to update user'
          toast.error(msg)
          reject(err)
        }
      }, 500)
    })
  }

  // 3. Delete User
  const deleteUser = async (id: string): Promise<boolean> => {
    setIsLoading(true)

    return new Promise<boolean>((resolve, reject) => {
      setTimeout(() => {
        try {
          const target = users.find((u) => u.id === id)
          if (!target) {
            throw new Error(`User not found.`)
          }

          // Guard 1: Cannot delete own account
          if (currentUser && currentUser.id === id) {
            throw new Error('You cannot delete your own active administrator account.')
          }

          // Guard 2: Cannot delete the last remaining admin
          if (target.role === 'admin') {
            const adminCount = users.filter((u) => u.role === 'admin').length
            if (adminCount <= 1) {
              throw new Error('Cannot delete the sole remaining Administrator account.')
            }
          }

          const updated = users.filter((u) => u.id !== id)
          persist(updated)
          setIsLoading(false)
          toast.success(`User "${target.full_name}" has been deleted.`)
          resolve(true)
        } catch (err: unknown) {
          setIsLoading(false)
          const msg = err instanceof Error ? err.message : 'Failed to delete user'
          toast.error(msg)
          reject(err)
        }
      }, 500)
    })
  }

  // 4. Toggle Active Status
  const toggleUserStatus = async (id: string): Promise<boolean> => {
    const target = users.find((u) => u.id === id)
    if (!target) return false

    // Guard: cannot deactivate own account
    if (currentUser && currentUser.id === id) {
      toast.error('You cannot deactivate your own logged-in account.')
      return false
    }

    try {
      await updateUser(id, { is_active: !target.is_active })
      return true
    } catch {
      return false
    }
  }

  // 5. Reset Password
  const resetPassword = async (id: string): Promise<boolean> => {
    const target = users.find((u) => u.id === id)
    if (!target) return false

    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        toast.success(`Password reset instructions sent to ${target.email || target.full_name}`, {
          description: 'A secure temporary recovery link has been dispatched.',
        })
        resolve(true)
      }, 600)
    })
  }

  return {
    users,
    stats,
    isLoading,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    resetPassword,
  }
}

export default useUsers
