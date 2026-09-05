import { createError, getCookie } from 'h3'
import { z } from 'zod'
import type { QuizAnswerResult, QuizOptionKey, QuizQuestion } from '@@/types/quiz'
import type { Database } from '@@/types/database'
import { serverSupabaseServiceRole } from '#supabase/server'

export const QUIZ_SESSION_COOKIE = 'sporting_quiz_session'

const optionSchema = z.enum(['a', 'b', 'c', 'd'])

export const quizAnswerSchema = z.object({
  question_id: z.uuid('Nieprawidłowe pytanie.'),
  selected_option: optionSchema,
})

export const quizLeaderboardSubmissionSchema = z.object({
  display_name: z.string()
    .trim()
    .min(2, 'Wpisz nazwę składającą się z co najmniej 2 znaków.')
    .max(24, 'Nazwa może mieć maksymalnie 24 znaki.')
    .regex(/^[\p{L}\p{N} '-]+$/u, 'Nazwa może zawierać tylko litery, cyfry, spacje, apostrofy i myślniki.'),
})

const answerResultSchema = z.object({
  is_correct: z.boolean(),
  correct_option: optionSchema,
  explanation: z.string(),
  points_awarded: z.number().int().min(0).max(30),
  score: z.number().int().min(0),
  lives_remaining: z.number().int().min(0).max(3),
  finished: z.boolean(),
})

const leaderboardSubmissionResultSchema = z.object({
  submitted: z.boolean(),
  qualifies: z.boolean(),
})

type QuizServiceClient = ReturnType<typeof serverSupabaseServiceRole<Database>>

export function getQuizSessionId(event: Parameters<typeof getCookie>[0]): string {
  const sessionId = getCookie(event, QUIZ_SESSION_COOKIE)
  if (!sessionId || !z.uuid().safeParse(sessionId).success) {
    throw createError({ statusCode: 401, statusMessage: 'Rozpocznij nową grę.' })
  }

  return sessionId
}

export async function drawQuizQuestion(client: QuizServiceClient, sessionId: string): Promise<QuizQuestion | null> {
  const { data, error } = await client.rpc('draw_quiz_question', { p_session_id: sessionId })
  if (error) {
    throw createError({ statusCode: 409, statusMessage: error.message || 'Nie udało się pobrać kolejnego pytania.' })
  }

  const question = data[0]
  if (!question) {
    return null
  }

  const options: QuizQuestion['options'] = [
    { key: 'a', text: question.option_a },
    { key: 'b', text: question.option_b },
    { key: 'c', text: question.option_c },
    { key: 'd', text: question.option_d },
  ]

  for (let index = options.length - 1; index > 0; index -= 1) {
    const shuffledIndex = Math.floor(Math.random() * (index + 1))
    const current = options[index]
    options[index] = options[shuffledIndex] as QuizQuestion['options'][number]
    options[shuffledIndex] = current as QuizQuestion['options'][number]
  }

  return {
    id: question.id,
    question: question.question,
    options,
    difficulty: question.difficulty,
    topic: question.topic,
  }
}

export async function answerQuizQuestion(
  client: QuizServiceClient,
  sessionId: string,
  questionId: string,
  selectedOption: QuizOptionKey,
): Promise<QuizAnswerResult> {
  const { data, error } = await client.rpc('answer_quiz_question', {
    p_session_id: sessionId,
    p_question_id: questionId,
    p_selected_option: selectedOption,
  })

  if (error) {
    throw createError({ statusCode: 409, statusMessage: error.message || 'Nie udało się sprawdzić odpowiedzi.' })
  }

  return answerResultSchema.parse(data)
}

export async function submitQuizLeaderboardEntry(
  client: QuizServiceClient,
  sessionId: string,
  displayName: string,
): Promise<{ submitted: boolean, qualifies: boolean }> {
  const { data, error } = await client.rpc('submit_quiz_leaderboard_entry', {
    p_session_id: sessionId,
    p_display_name: displayName,
  })

  if (error) {
    throw createError({ statusCode: 409, statusMessage: error.message || 'Nie udało się zapisać wyniku.' })
  }

  return leaderboardSubmissionResultSchema.parse(data)
}
