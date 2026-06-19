import type { AppProfile, AppRole, AppUserStatus } from '@@/types/auth'

export type ManagedAppRole = Exclude<AppRole, 'admin'>

export type AdminManagedUser = Omit<AppProfile, 'role'> & {
  role: ManagedAppRole
}

export type AdminUserListRoleFilter = ManagedAppRole | 'all'
export type AdminUserListStatusFilter = AppUserStatus | 'all'

export type AdminUsersListResponse = {
  users: AdminManagedUser[]
}

export type AdminUserUpsertInput = {
  email: string
  full_name: string
  role: ManagedAppRole
  status: AppUserStatus
}

export type AdminUserMutationResponse = {
  user: AdminManagedUser
  setupEmailSent?: boolean
  setupEmailError?: string | null
}
