/**
 * Shared design-system types for status-driven UI primitives and role-aware nav.
 */
import type { AppRole } from '@@/types/auth'

export type StatusKey = 'confirmed' | 'declined' | 'pending' | 'neutral'

export type AvatarChipProps = {
  initials: string
  status: StatusKey
  label?: string
}

export type NavItem = {
  label: string
  icon: string
  to: string
  role: AppRole[]
}
