import { serverSupabaseServiceRole } from '#supabase/server'
import { drawQuizQuestion, getQuizSessionId } from '@@/server/utils/quiz'
import type { Database } from '@@/types/database'
import type { QuizQuestion } from '@@/types/quiz'

export default defineEventHandler(async (event): Promise<{ question: QuizQuestion }> => {
  const sessionId = getQuizSessionId(event)
  const client = serverSupabaseServiceRole<Database>(event)
  return { question: await drawQuizQuestion(client, sessionId) }
})
