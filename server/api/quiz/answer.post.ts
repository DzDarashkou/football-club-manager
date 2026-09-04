import { readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { answerQuizQuestion, getQuizSessionId, quizAnswerSchema } from '@@/server/utils/quiz'
import type { Database } from '@@/types/database'
import type { QuizAnswerResult } from '@@/types/quiz'

export default defineEventHandler(async (event): Promise<{ result: QuizAnswerResult }> => {
  const sessionId = getQuizSessionId(event)
  const payload = quizAnswerSchema.parse(await readBody(event))
  const client = serverSupabaseServiceRole<Database>(event)
  const result = await answerQuizQuestion(client, sessionId, payload.question_id, payload.selected_option)
  return { result }
})
