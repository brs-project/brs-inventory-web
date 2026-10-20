import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import type { UserProfile } from '@types'

export function useAuth() {
  const navigate = useNavigate()
  const { user, setUser, clearUser, isLoading: storeLoading, setIsLoading: setStoreLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * Mock asynchronous Sign In operation (1500ms delay)
   */
  const signIn = async (email: string, password: string): Promise<UserProfile> => {
    setLoading(true)
    setStoreLoading(true)
    setError(null)

    return new Promise<UserProfile>((resolve, reject) => {
      setTimeout(() => {
        // Special case simulation for disabled account testing
        if (email.toLowerCase().includes('disabled')) {
          const disabledUser: UserProfile = {
            id: '99',
            full_name: 'Disabled User',
            role: 'operator',
            is_active: false,
            created_at: new Date().toISOString(),
          }
          setUser(disabledUser)
          setLoading(false)
          setStoreLoading(false)
          resolve(disabledUser)
          return
        }

        // Special case simulation for wrong password testing
        if (password === 'wrongpass') {
          const errMessage = 'Invalid email or password. Please check your credentials.'
          setError(errMessage)
          setLoading(false)
          setStoreLoading(false)
          reject(new Error(errMessage))
          return
        }

        // Standard successful sign in
        const mockUser: UserProfile = {
          id: '1',
          full_name: 'Admin User',
          phone: '+91 98765 43210',
          role: 'admin',
          is_active: true,
          created_at: '2026-09-14T09:00:00Z',
        }

        setUser(mockUser)
        setLoading(false)
        setStoreLoading(false)
        resolve(mockUser)
      }, 1500)
    })
  }

  /**
   * Mock asynchronous Password Reset Link operation (1500ms delay)
   */
  const resetPassword = async (_email: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        setLoading(false)
        resolve(true)
      }, 1500)
    })
  }

  /**
   * Sign out current user and redirect to login
   */
  const signOut = () => {
    clearUser()
    navigate('/login', { replace: true })
  }

  /**
   * Get current authenticated user
   */
  const getCurrentUser = (): UserProfile | null => {
    return user
  }

  return {
    user,
    isLoading: loading || storeLoading,
    error,
    setError,
    signIn,
    resetPassword,
    signOut,
    getCurrentUser,
  }
}
