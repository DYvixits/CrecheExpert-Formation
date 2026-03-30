import { type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { hasPermission, hasMinRole, type Permission, type UserRole } from '../lib/rbac'
import { EmptyState } from '@blinkdotnew/ui'
import { ShieldOff } from 'lucide-react'

interface RoleGuardProps {
  /** Require at least this role */
  minRole?: UserRole
  /** Require all of these permissions */
  permissions?: Permission[]
  /** Shown when access is denied (default: inline "Accès refusé" block) */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Wraps content that should only be visible to users with the right role/permissions.
 * Usage:
 *   <RoleGuard minRole="manager">...</RoleGuard>
 *   <RoleGuard permissions={['vault:delete']}>...</RoleGuard>
 */
export default function RoleGuard({ minRole, permissions, fallback, children }: RoleGuardProps) {
  const { profile, isLoading } = useAuth()

  if (isLoading) return null

  const role = profile?.role as UserRole | undefined

  const roleOk = minRole ? hasMinRole(role, minRole) : true
  const permsOk = permissions ? permissions.every(p => hasPermission(role, p)) : true

  if (!roleOk || !permsOk) {
    if (fallback !== undefined) return <>{fallback}</>
    return (
      <div className="flex items-center justify-center py-20">
        <EmptyState
          icon={<ShieldOff className="text-destructive/60" />}
          title="Accès restreint"
          description="Vous ne disposez pas des permissions nécessaires pour accéder à cette section."
        />
      </div>
    )
  }

  return <>{children}</>
}
