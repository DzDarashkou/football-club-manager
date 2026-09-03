import type { QuizDifficulty } from '@@/types/database'

export type QuizOptionKey = 'a' | 'b' | 'c' | 'd'

export interface QuizOption {
  key: QuizOptionKey
  text: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: QuizOption[]
  difficulty: QuizDifficulty
  topic: string
}

export interface QuizAnswerResult {
  is_correct: boolean
  correct_option: QuizOptionKey
  explanation: string
  points_awarded: number
  score: number
  lives_remaining: number
  finished: boolean
}

export interface QuizLeaderboardEntry {
  id: string
  display_name: string
  score: number
  correct_answers: number
  created_at: string
}
