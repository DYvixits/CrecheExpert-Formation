/**
 * Role-Based Access Control (RBAC)
 * 
 * Role hierarchy (highest to lowest):
 *   admin > manager > trainer > professional
 *
 * Each role inherits all permissions of roles below it.
 */

export type UserRole = 'admin' | 'manager' | 'trainer' | 'professional'

export type Permission =
  // Diagnostic
  | 'diagnostic:create'
  | 'diagnostic:view_own'
  | 'diagnostic:view_all'
  // Catalog
  | 'catalog:view'
  | 'catalog:manage'
  // Vault / Documents
  | 'vault:upload'
  | 'vault:view_own'
  | 'vault:view_all'
  | 'vault:delete'
  // Team
  | 'team:view'
  | 'team:manage'
  | 'team:invite'
  // Structure
  | 'structure:view'
  | 'structure:manage'
  // Admin
  | 'admin:users'
  | 'admin:platform'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  professional: [
    'diagnostic:create',
    'diagnostic:view_own',
    'catalog:view',
    'vault:upload',
    'vault:view_own',
    'structure:view',
  ],
  trainer: [
    'diagnostic:create',
    'diagnostic:view_own',
    'catalog:view',
    'catalog:manage',
    'vault:upload',
    'vault:view_own',
    'structure:view',
  ],
  manager: [
    'diagnostic:create',
    'diagnostic:view_own',
    'diagnostic:view_all',
    'catalog:view',
    'catalog:manage',
    'vault:upload',
    'vault:view_own',
    'vault:view_all',
    'vault:delete',
    'team:view',
    'team:manage',
    'team:invite',
    'structure:view',
    'structure:manage',
  ],
  admin: [
    'diagnostic:create',
    'diagnostic:view_own',
    'diagnostic:view_all',
    'catalog:view',
    'catalog:manage',
    'vault:upload',
    'vault:view_own',
    'vault:view_all',
    'vault:delete',
    'team:view',
    'team:manage',
    'team:invite',
    'structure:view',
    'structure:manage',
    'admin:users',
    'admin:platform',
  ],
}

export const ROLE_LABELS: Record<UserRole, string> = {
  professional: 'Personnel Qualifié',
  trainer: 'Formateur',
  manager: 'Gestionnaire / Directeur',
  admin: 'Administrateur Plateforme',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  professional: 'Accès à son propre espace : diagnostic, catalogue et coffre-fort personnel.',
  trainer: 'Accès au catalogue en lecture/écriture, gestion de ses sessions de formation.',
  manager: 'Pilotage complet de la structure : équipe, documents, conformité.',
  admin: 'Accès total à la plateforme, gestion des utilisateurs et de la configuration.',
}

/** Returns all permissions for a given role */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.professional
}

/** Checks if a role has a specific permission */
export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false
  return getPermissions(role).includes(permission)
}

/** Checks if a role meets a minimum level */
export function hasMinRole(role: UserRole | undefined, minRole: UserRole): boolean {
  const hierarchy: UserRole[] = ['professional', 'trainer', 'manager', 'admin']
  if (!role) return false
  return hierarchy.indexOf(role) >= hierarchy.indexOf(minRole)
}
