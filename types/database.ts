import type { AppRole, AppUserStatus } from '@@/types/auth'

export type Database = {
  public: {
    Tables: {
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
        Row: { id: string, name: string, address: string | null, city: string | null, is_active: boolean, created_at: string, updated_at: string }
        Insert: { id?: string, name: string, address?: string | null, city?: string | null, is_active?: boolean, created_at?: string, updated_at?: string }
        Update: { id?: string, name?: string, address?: string | null, city?: string | null, is_active?: boolean, created_at?: string, updated_at?: string }
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
      quiz_questions: {
        Row: { id: string, question: string, option_a: string, option_b: string, option_c: string, option_d: string, correct_option: 'a' | 'b' | 'c' | 'd', difficulty: QuizDifficulty, topic: string, explanation: string, source_url: string | null, is_active: boolean, created_at: string, updated_at: string }
        Insert: { id?: string, question: string, option_a: string, option_b: string, option_c: string, option_d: string, correct_option: 'a' | 'b' | 'c' | 'd', difficulty: QuizDifficulty, topic: string, explanation: string, source_url?: string | null, is_active?: boolean, created_at?: string, updated_at?: string }
        Update: { id?: string, question?: string, option_a?: string, option_b?: string, option_c?: string, option_d?: string, correct_option?: 'a' | 'b' | 'c' | 'd', difficulty?: QuizDifficulty, topic?: string, explanation?: string, source_url?: string | null, is_active?: boolean, created_at?: string, updated_at?: string }
        Relationships: []
      }
      quiz_sessions: {
        Row: { id: string, score: number, lives_remaining: number, status: 'in_progress' | 'finished' | 'leaderboard_submitted', current_question_id: string | null, started_at: string, finished_at: string | null, leaderboard_submitted_at: string | null, expires_at: string }
        Insert: { id?: string, score?: number, lives_remaining?: number, status?: 'in_progress' | 'finished' | 'leaderboard_submitted', current_question_id?: string | null, started_at?: string, finished_at?: string | null, leaderboard_submitted_at?: string | null, expires_at?: string }
        Update: { id?: string, score?: number, lives_remaining?: number, status?: 'in_progress' | 'finished' | 'leaderboard_submitted', current_question_id?: string | null, started_at?: string, finished_at?: string | null, leaderboard_submitted_at?: string | null, expires_at?: string }
        Relationships: []
      }
      quiz_session_questions: {
        Row: { session_id: string, question_id: string, sequence_number: number, selected_option: 'a' | 'b' | 'c' | 'd' | null, is_correct: boolean | null, points_awarded: number, presented_at: string, answered_at: string | null }
        Insert: { session_id: string, question_id: string, sequence_number: number, selected_option?: 'a' | 'b' | 'c' | 'd' | null, is_correct?: boolean | null, points_awarded?: number, presented_at?: string, answered_at?: string | null }
        Update: { session_id?: string, question_id?: string, sequence_number?: number, selected_option?: 'a' | 'b' | 'c' | 'd' | null, is_correct?: boolean | null, points_awarded?: number, presented_at?: string, answered_at?: string | null }
        Relationships: []
      }
      quiz_leaderboard_entries: {
        Row: { id: string, display_name: string, score: number, correct_answers: number, created_at: string }
        Insert: { id?: string, display_name: string, score: number, correct_answers: number, created_at?: string }
        Update: { id?: string, display_name?: string, score?: number, correct_answers?: number, created_at?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      draw_quiz_question: {
        Args: { p_session_id: string }
        Returns: { id: string, question: string, option_a: string, option_b: string, option_c: string, option_d: string, difficulty: QuizDifficulty, topic: string }[]
      }
      answer_quiz_question: {
        Args: { p_session_id: string, p_question_id: string, p_selected_option: string }
        Returns: unknown
      }
      submit_quiz_leaderboard_entry: {
        Args: { p_session_id: string, p_display_name: string }
        Returns: unknown
      }
    }
    Enums: {
      app_role: AppRole
      user_status: AppUserStatus
      quiz_difficulty: QuizDifficulty
    }
    CompositeTypes: Record<string, never>
  }
}

export type QuizDifficulty = 'easy' | 'medium' | 'hard'
