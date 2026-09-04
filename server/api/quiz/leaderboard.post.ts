import { readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { getQuizSessionId, quizLeaderboardSubmissionSchema, submitQuizLeaderboardEntry } from '@@/server/utils/quiz'
import type { Database } from '@@/types/database'

export default defineEventHandler(async (event): Promise<{ submitted: boolean, qualifies: boolean }> => {
  const sessionId = getQuizSessionId(event)
  const payload = quizLeaderboardSubmissionSchema.parse(await readBody(event))
  const client = serverSupabaseServiceRole<Database>(event)
  return submitQuizLeaderboardEntry(client, sessionId, payload.display_name)
})
