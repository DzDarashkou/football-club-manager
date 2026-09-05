import { setCookie } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { QUIZ_SESSION_COOKIE, drawQuizQuestion } from '@@/server/utils/quiz'
import type { Database } from '@@/types/database'
import type { QuizQuestion } from '@@/types/quiz'

export default defineEventHandler(async (event): Promise<{ question: QuizQuestion, score: number, lives_remaining: number }> => {
  const client = serverSupabaseServiceRole<Database>(event)
  const { data: session, error } = await client
    .from('quiz_sessions')
    .insert({})
    .select('id, score, lives_remaining')
    .single()

  if (error || !session) {
    throw createError({ statusCode: 500, statusMessage: 'Nie udało się rozpocząć quizu.' })
  }

  const question = await drawQuizQuestion(client, session.id)
  if (!question) {
    throw createError({ statusCode: 409, statusMessage: 'Brak dostępnych pytań. Spróbuj ponownie później.' })
  }

  setCookie(event, QUIZ_SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: 60 * 60 * 2,
    path: '/',
  })

  return { question, score: session.score, lives_remaining: session.lives_remaining }
})
