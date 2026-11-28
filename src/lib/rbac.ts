import type { AuthUser, BackendUserType, Permission, UserRole } from '@/types/arandu'

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  student: ['catalog:read', 'loans:self'],
  teacher: ['catalog:read', 'admin:panel', 'admin:books', 'admin:students', 'admin:classes'],
}

export const ROLE_HOME_ROUTE: Record<UserRole, string> = {
  student: '/catalogo',
  teacher: '/admin-acervo',
}

export function resolveRoleFromBackend(
  tipo: BackendUserType | string | undefined,
  isLibrarian: boolean,
): UserRole {
  if (isLibrarian || tipo === 'BIBLIOTECARIO') {
    return 'teacher'
  }
  return 'student'
}

export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user || !user.active) return false
  return ROLE_PERMISSIONS[user.role].includes(permission)
}

export function hasAllowedRole(
  user: AuthUser | null,
  allowedRole?: UserRole | UserRole[],
): boolean {
  if (!user || !user.active) return false
  if (!allowedRole) return true
  const allowedList = Array.isArray(allowedRole) ? allowedRole : [allowedRole]
  return allowedList.includes(user.role)
}
