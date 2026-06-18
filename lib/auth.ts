import type { AppProfile, AppRole } from '@@/types/auth'

export const APP_ROLES = ['admin', 'coach', 'parent'] as const satisfies readonly AppRole[]

export const PUBLIC_PATHS = ['/', '/login', '/forgot-password', '/test-tokens'] as const

export const ROLE_HOME: Record<AppRole, string> = {
  admin: '/admin',
  coach: '/coach',
  parent: '/dashboard',
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === 'string' && APP_ROLES.includes(value as AppRole)
}

export function isPublicPath(path: string) {
  return PUBLIC_PATHS.includes(path as typeof PUBLIC_PATHS[number])
}

export function getRoleHome(role: AppRole) {
  return ROLE_HOME[role]
}

export function getProfileDisplayName(profile: Pick<AppProfile, 'full_name' | 'email'> | null) {
  if (!profile) {
    return 'Sporting User'
  }

  return profile.full_name?.trim() || profile.email
}

export function getProfileInitials(profile: Pick<AppProfile, 'full_name' | 'email'> | null) {
  const source = profile?.full_name?.trim() || profile?.email || 'Sporting User'
  const parts = source
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)

  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'SU'
}
