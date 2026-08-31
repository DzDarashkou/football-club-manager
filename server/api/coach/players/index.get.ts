import { getPlayers, playerListQuerySchema } from '@@/server/utils/admin-club'
import { requireCoachAccess } from '@@/server/utils/game-attendance'

export default defineEventHandler(async (event) => {
  const { adminClient, userId, role } = await requireCoachAccess(event)
  const players = await getPlayers(adminClient, playerListQuerySchema.parse({}))
  if (role === 'admin') return { players }

  const { data: assignments, error } = await adminClient.from('coach_teams').select('team_id').eq('coach_id', userId)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load team assignments.' })
  const teamIds = new Set((assignments ?? []).map((item) => item.team_id))
  return { players: players.filter((player) => teamIds.has(player.team_id)) }
})
