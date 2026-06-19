import type { AppRole, AppUserStatus } from '@@/types/auth'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: AppRole
          status: AppUserStatus
          full_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: AppRole
          status?: AppUserStatus
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: AppRole
          status?: AppUserStatus
          full_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      app_role: AppRole
      user_status: AppUserStatus
    }
    CompositeTypes: Record<string, never>
  }
}
