import { z } from 'zod'
import { requireCoachGame } from '@@/server/utils/game-attendance'
import { getActiveTeamPlayers } from '@@/server/utils/game-attendance'
export default defineEventHandler(async (event) => { const gameId = z.uuid().parse(event.context.params?.id); const { adminClient, game } = await requireCoachGame(event, gameId); return { players: await getActiveTeamPlayers(adminClient, game.team_id) } })
