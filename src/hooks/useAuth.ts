import { useState, useEffect } from 'react'
import { blink } from '../blink/client'
import { hasPermission, hasMinRole, getPermissions, type Permission, type UserRole } from '../lib/rbac'

export type { UserRole }

export interface UserProfile {
  userId: string
  role: UserRole
  fullName: string
  diploma?: string
  structureId?: string
  avatarUrl?: string
  emailVerified?: boolean
  permissions?: string // JSON string of extra permissions
}

interface AuthUser {
  id: string
  email?: string
  displayName?: string
  role?: string
  emailVerified?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged(async (state) => {
      setUser(state.user as AuthUser | null)

      if (state.user && state.isAuthenticated) {
        try {
          const results = await blink.db.user_profiles.list({
            where: { userId: state.user.id },
            limit: 1,
          })
          if (results && results.length > 0) {
            setProfile(results[0] as unknown as UserProfile)
          } else {
            const authUser = state.user as AuthUser
            const newProfile = {
              userId: authUser.id,
              role: (authUser.role as UserRole) || 'professional',
              fullName: authUser.displayName || authUser.email?.split('@')[0] || 'Utilisateur',
              emailVerified: Number(authUser.emailVerified) > 0,
            }
            // upsert avoids duplicate-key errors on race conditions
            await blink.db.user_profiles.upsert(newProfile)
            setProfile(newProfile as UserProfile)
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        }
      } else if (!state.isAuthenticated) {
        setProfile(null)
      }

      if (!state.isLoading) setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const role = profile?.role as UserRole | undefined
  const isAuthenticated = !!user

  return {
    user,
    profile,
    isAuthenticated,
    isLoading,
    // Role shortcuts
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isProfessional: role === 'professional',
    isTrainer: role === 'trainer',
    // RBAC helpers
    can: (permission: Permission) => hasPermission(role, permission),
    hasMinRole: (minRole: UserRole) => hasMinRole(role, minRole),
    permissions: role ? getPermissions(role) : [],
  }
}
