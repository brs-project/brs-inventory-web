import { supabase } from './supabaseClient'
import { useAuthStore } from '@store/authStore'

export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER'

export interface UserProfileItem {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at?: string | null
}

export interface CreateUserInput {
  full_name: string
  email: string
  phone?: string | null
  role: UserRole
}

function normalizeRole(role: string): UserRole {
  const upper = role?.toUpperCase()
  if (upper === 'ADMIN') return 'ADMIN'
  if (upper === 'MANAGER') return 'MANAGER'
  if (upper === 'OPERATOR') return 'OPERATOR'
  return 'VIEWER'
}

function getEffectiveCurrentUserId(overrideId?: string): string | undefined {
  if (overrideId) return overrideId
  const currentUser = useAuthStore.getState().user
  return currentUser?.id
}

/**
 * Fetch all user profiles from public.user_profiles ordered by created_at DESC
 */
export async function fetchUsers(): Promise<UserProfileItem[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users from Supabase:', error)
    throw error
  }

  return (data || []).map((u) => ({
    id: u.id,
    full_name: u.full_name,
    email: u.email,
    phone: u.phone,
    role: normalizeRole(u.role),
    is_active: Boolean(u.is_active),
    created_at: u.created_at || new Date().toISOString(),
    updated_at: u.updated_at,
  }))
}

/**
 * Insert a new user directly into public.user_profiles and return the newly created row
 */
export async function createUser(payload: CreateUserInput): Promise<UserProfileItem> {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([
      {
        email: payload.email.trim().toLowerCase(),
        full_name: payload.full_name.trim(),
        phone: payload.phone?.trim() || null,
        role: payload.role,
        is_active: true,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating user in Supabase:', error)
    throw error
  }

  return {
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    role: normalizeRole(data.role),
    is_active: Boolean(data.is_active),
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at,
  }
}

/**
 * Update user role directly in public.user_profiles with self-lockout guard
 */
export async function updateUserRole(
  id: string,
  role: UserRole,
  currentUserId?: string
): Promise<UserProfileItem> {
  const activeUserId = getEffectiveCurrentUserId(currentUserId)
  if (activeUserId && activeUserId === id && role !== 'ADMIN') {
    throw new Error('Self-lockout prevented: You cannot demote your own administrator role.')
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ role, updated_at: now })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating user role in Supabase:', error)
    throw error
  }

  return {
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    role: normalizeRole(data.role),
    is_active: Boolean(data.is_active),
    created_at: data.created_at || now,
    updated_at: data.updated_at,
  }
}

/**
 * Toggle user active/inactive status directly in public.user_profiles with self-lockout guard
 */
export async function toggleUserStatus(
  id: string,
  is_active: boolean,
  currentUserId?: string
): Promise<UserProfileItem> {
  const activeUserId = getEffectiveCurrentUserId(currentUserId)
  if (activeUserId && activeUserId === id && !is_active) {
    throw new Error('Self-lockout prevented: You cannot deactivate your own account.')
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ is_active, updated_at: now })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling user status in Supabase:', error)
    throw error
  }

  return {
    id: data.id,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    role: normalizeRole(data.role),
    is_active: Boolean(data.is_active),
    created_at: data.created_at || now,
    updated_at: data.updated_at,
  }
}

/**
 * Delete a user profile directly from public.user_profiles with self-lockout guard
 */
export async function deleteUser(id: string, currentUserId?: string): Promise<void> {
  const activeUserId = getEffectiveCurrentUserId(currentUserId)
  if (activeUserId && activeUserId === id) {
    throw new Error('Self-lockout prevented: You cannot delete your own account.')
  }

  const { error } = await supabase
    .from('user_profiles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting user in Supabase:', error)
    throw error
  }
}
