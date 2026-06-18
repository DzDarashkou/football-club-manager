export type AppRole = 'admin' | 'coach' | 'parent'

export type AppProfile = {
  id: string
  email: string
  role: AppRole
  full_name: string | null
  created_at: string
  updated_at: string
}

export type LoginCredentials = {
  email: string
  password: string
}
