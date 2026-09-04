import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/database'
import type { QuizLeaderboardEntry } from '@@/types/quiz'

export default defineEventHandler(async (event): Promise<{ entries: QuizLeaderboardEntry[] }> => {
  const client = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await client
    .from('quiz_leaderboard_entries')
    .select('id, display_name, score, correct_answers, created_at')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(10)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Nie udało się pobrać tabeli wyników.' })
  }

  return { entries: data ?? [] }
})
