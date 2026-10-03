import { getGames } from '@@/server/utils/admin-games'
import { requireCoachAccess } from '@@/server/utils/game-attendance'

export default defineEventHandler(async (event) => {
  const { adminClient, userId, role } = await requireCoachAccess(event)

  const games = await getGames(adminClient)
  if (role === 'admin') return { games }

  const { data: assignments, error } = await adminClient
    .from('coach_teams')
    .select('team_id')
    .eq('coach_id', userId)
  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to load team assignments.',
    })
  const teamIds = new Set((assignments ?? []).map((item) => item.team_id))
  return { games: games.filter((game) => teamIds.has(game.team_id)) }
})
