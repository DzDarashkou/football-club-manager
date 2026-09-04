import { readBody } from 'h3'
import { getPlayerById, playerUpdateSchema, recordIdSchema, requireActiveTeam } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminPlayer } from '@@/types/admin-club'

export default defineEventHandler(async (event): Promise<{ player: AdminPlayer }> => {
  const { adminClient } = await requireAdminAccess(event)
  const playerId = recordIdSchema.parse(event.context.params?.id)
  const payload = playerUpdateSchema.parse(await readBody(event))
  try {
    if (payload.team_ids) await Promise.all(payload.team_ids.map((teamId) => requireActiveTeam(adminClient, teamId)))
    const { team_ids, ...playerPayload } = payload
    let exists = true
    if (Object.keys(playerPayload).length) {
      const { data, error } = await adminClient.from('players').update(playerPayload).eq('id', playerId).select('id').maybeSingle()
      if (error) handleApiError(error, 'Unable to update the player.', 400)
      exists = Boolean(data)
    }
    else {
      const { data, error } = await adminClient.from('players').select('id').eq('id', playerId).maybeSingle()
      if (error) handleApiError(error, 'Unable to update the player.', 400)
      exists = Boolean(data)
    }
    if (!exists) handleApiError(new Error('Player not found.'), 'Unable to update the player.', 404)
    if (team_ids) {
      const { error: deleteError } = await adminClient.from('player_teams').delete().eq('player_id', playerId)
      if (deleteError) handleApiError(deleteError, 'Unable to update player team assignments.', 400)
      const { error: insertError } = await adminClient.from('player_teams').insert(team_ids.map((team_id) => ({ player_id: playerId, team_id })))
      if (insertError) handleApiError(insertError, 'Unable to update player team assignments.', 400)
    }
    const player = await getPlayerById(adminClient, playerId)
    if (!player) throw new Error('Updated player could not be loaded.')
    return { player }
  }
  catch (error) { handleApiError(error, 'Unable to update the player.', 400) }
})
