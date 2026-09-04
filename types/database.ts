import type { AppRole, AppUserStatus } from '@@/types/auth'

export type Database = {
  public: {
    Tables: {
      weather_location_cache: {
        Row: { city_key: string, city: string, latitude: number, longitude: number, updated_at: string }
        Insert: { city_key: string, city: string, latitude: number, longitude: number, updated_at?: string }
        Update: { city_key?: string, city?: string, latitude?: number, longitude?: number, updated_at?: string }
        Relationships: []
      }
      match_weather_cache: {
        Row: { game_id: string, kickoff_at: string, latitude: number, longitude: number, temperature_min: number, temperature_max: number, precipitation_probability: number, precipitation_mm: number, max_rain_mm: number, snowfall_mm: number, condition: string, fetched_at: string, expires_at: string }
        Insert: { game_id: string, kickoff_at: string, latitude: number, longitude: number, temperature_min: number, temperature_max: number, precipitation_probability: number, precipitation_mm: number, max_rain_mm: number, snowfall_mm?: number, condition: string, fetched_at?: string, expires_at: string }
        Update: { game_id?: string, kickoff_at?: string, latitude?: number, longitude?: number, temperature_min?: number, temperature_max?: number, precipitation_probability?: number, precipitation_mm?: number, max_rain_mm?: number, snowfall_mm?: number, condition?: string, fetched_at?: string, expires_at?: string }
        Relationships: []
      }
      game_players: {
        Row: { game_id: string, player_id: string, availability_status: string, availability_note: string | null, responded_at: string | null, selection_status: string, participated: boolean, minutes_played: number, goals: number, assists: number, yellow_cards: number, red_cards: number, coach_note: string | null, created_at: string, updated_at: string }
        Insert: { game_id: string, player_id: string, availability_status?: string, availability_note?: string | null, responded_at?: string | null, selection_status?: string, participated?: boolean, minutes_played?: number, goals?: number, assists?: number, yellow_cards?: number, red_cards?: number, coach_note?: string | null, created_at?: string, updated_at?: string }
        Update: { game_id?: string, player_id?: string, availability_status?: string, availability_note?: string | null, responded_at?: string | null, selection_status?: string, participated?: boolean, minutes_played?: number, goals?: number, assists?: number, yellow_cards?: number, red_cards?: number, coach_note?: string | null, created_at?: string, updated_at?: string }
        Relationships: []
      }
      coach_teams: {
        Row: { coach_id: string, team_id: string, created_at: string }
        Insert: { coach_id: string, team_id: string, created_at?: string }
        Update: { coach_id?: string, team_id?: string, created_at?: string }
        Relationships: []
      }
      player_parents: {
        Row: { player_id: string, parent_id: string, relationship_label: string | null, created_at: string }
        Insert: { player_id: string, parent_id: string, relationship_label?: string | null, created_at?: string }
        Update: { player_id?: string, parent_id?: string, relationship_label?: string | null, created_at?: string }
        Relationships: []
      }
      seasons: {
        Row: { id: string, name: string, starts_on: string, ends_on: string, is_active: boolean, created_at: string, updated_at: string }
        Insert: { id?: string, name: string, starts_on: string, ends_on: string, is_active?: boolean, created_at?: string, updated_at?: string }
        Update: { id?: string, name?: string, starts_on?: string, ends_on?: string, is_active?: boolean, created_at?: string, updated_at?: string }
        Relationships: []
      }
      competitions: {
        Row: { id: string, season_id: string, name: string, type: string, is_active: boolean, created_at: string, updated_at: string }
        Insert: { id?: string, season_id: string, name: string, type: string, is_active?: boolean, created_at?: string, updated_at?: string }
        Update: { id?: string, season_id?: string, name?: string, type?: string, is_active?: boolean, created_at?: string, updated_at?: string }
        Relationships: []
      }
      venues: {
        Row: { id: string, name: string, address: string | null, city: string | null, latitude: number | null, longitude: number | null, is_active: boolean, created_at: string, updated_at: string }
        Insert: { id?: string, name: string, address?: string | null, city?: string | null, latitude?: number | null, longitude?: number | null, is_active?: boolean, created_at?: string, updated_at?: string }
        Update: { id?: string, name?: string, address?: string | null, city?: string | null, latitude?: number | null, longitude?: number | null, is_active?: boolean, created_at?: string, updated_at?: string }
        Relationships: []
      }
      games: {
        Row: { id: string, team_id: string, season_id: string, competition_id: string | null, venue_id: string | null, opponent_name: string, location_type: string, scheduled_at: string, matchday: number | null, round_label: string | null, status: string, home_score: number, away_score: number, notes: string | null, created_at: string, updated_at: string }
        Insert: { id?: string, team_id: string, season_id: string, competition_id?: string | null, venue_id?: string | null, opponent_name: string, location_type: string, scheduled_at: string, matchday?: number | null, round_label?: string | null, status?: string, home_score?: number, away_score?: number, notes?: string | null, created_at?: string, updated_at?: string }
        Update: { id?: string, team_id?: string, season_id?: string, competition_id?: string | null, venue_id?: string | null, opponent_name?: string, location_type?: string, scheduled_at?: string, matchday?: number | null, round_label?: string | null, status?: string, home_score?: number, away_score?: number, notes?: string | null, created_at?: string, updated_at?: string }
        Relationships: []
      }
      age_groups: {
        Row: {
          id: string
          name: string
          birth_year_from: number
          birth_year_to: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          birth_year_from: number
          birth_year_to: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          birth_year_from?: number
          birth_year_to?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          id: string
          name: string
          age_group_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          age_group_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          age_group_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          full_name: string
          shirt_number: number | null
          date_of_birth: string
          team_id: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          shirt_number?: number | null
          date_of_birth: string
          team_id: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          shirt_number?: number | null
          date_of_birth?: string
          team_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
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
