export type AppRole = 'admin' | 'coach' | 'parent'
export type AppUserStatus = 'active' | 'inactive'

export type AppProfile = {
  id: string
  email: string
  role: AppRole
  status: AppUserStatus
  full_name: string | null
  created_at: string
  updated_at: string
}

export type LoginCredentials = {
  email: string
  password: string
}
