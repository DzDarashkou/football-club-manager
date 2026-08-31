import { readBody } from 'h3'
import { getPlayerById, playerUpdateSchema, recordIdSchema, requireActiveTeam } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminPlayer } from '@@/types/admin-club'

export default defineEventHandler(async (event): Promise<{ player: AdminPlayer }> => {
  const { adminClient } = await requireAdminAccess(event)
  const playerId = recordIdSchema.parse(event.context.params?.id)
  const payload = playerUpdateSchema.parse(await readBody(event))
  try {
    if (payload.team_id) await requireActiveTeam(adminClient, payload.team_id)
    const { data, error } = await adminClient.from('players').update(payload).eq('id', playerId).select('id').maybeSingle()
    if (error) handleApiError(error, 'Unable to update the player.', 400)
    if (!data) handleApiError(new Error('Player not found.'), 'Unable to update the player.', 404)
    const player = await getPlayerById(adminClient, playerId)
    if (!player) throw new Error('Updated player could not be loaded.')
    return { player }
  }
  catch (error) { handleApiError(error, 'Unable to update the player.', 400) }
})
