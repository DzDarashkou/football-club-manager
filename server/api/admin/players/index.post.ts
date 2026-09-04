import { readBody } from 'h3'
import { getPlayerById, playerCreateSchema, requireActiveTeam } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminPlayer } from '@@/types/admin-club'

export default defineEventHandler(async (event): Promise<{ player: AdminPlayer }> => {
  const { adminClient } = await requireAdminAccess(event)
  const payload = playerCreateSchema.parse(await readBody(event))
  try {
    await Promise.all(payload.team_ids.map((teamId) => requireActiveTeam(adminClient, teamId)))
    const { team_ids, ...playerPayload } = payload
    const { data, error } = await adminClient.from('players').insert(playerPayload).select('id').single()
    if (error) handleApiError(error, 'Unable to create the player.', 400)
    const { error: assignmentError } = await adminClient.from('player_teams').insert(team_ids.map((team_id) => ({ player_id: data.id, team_id })))
    if (assignmentError) handleApiError(assignmentError, 'Unable to assign the player to teams.', 400)
    const player = await getPlayerById(adminClient, data.id)
    if (!player) throw new Error('Created player could not be loaded.')
    return { player }
  }
  catch (error) { handleApiError(error, 'Unable to create the player.', 400) }
})
