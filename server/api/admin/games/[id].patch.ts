import { gameUpdateSchema, validateGameReferences } from '@@/server/utils/admin-games'
import { recordIdSchema } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { Database } from '@@/types/database'
export default defineEventHandler(async (event) => {
  const { adminClient } = await requireAdminAccess(event); const id = recordIdSchema.parse(event.context.params?.id)
  const payload = gameUpdateSchema.parse(await readBody(event)
  )
  try {
    const current = await adminClient.from('games').select('team_id, season_id, competition_id, venue_id, opponent_name, location_type, scheduled_at, matchday, round_label, status, home_score, away_score, notes').eq('id', id).maybeSingle()
    if (current.error) handleApiError(current.error, 'Unable to load the game.', 400)
    if (!current.data) throw createError({ statusCode: 404, statusMessage: 'Game not found.' })
    const complete = { ...current.data, ...payload }
    await validateGameReferences(adminClient, complete as Parameters<typeof validateGameReferences>[1])
    const update = { ...payload, ...(typeof payload.scheduled_at === 'string' ? { scheduled_at: new Date(payload.scheduled_at).toISOString() } : {}) } as Database['public']['Tables']['games']['Update']
    const { error } = await adminClient.from('games').update(update).eq('id', id)
    if (error) handleApiError(error, 'Unable to update the game.', 400)
    return { success: true }
  } catch (error) { handleApiError(error, 'Unable to update the game.', 400) }
})
