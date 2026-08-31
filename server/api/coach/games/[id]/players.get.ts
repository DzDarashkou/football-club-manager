import { z } from 'zod'
import { getGamePlayers, requireCoachGame } from '@@/server/utils/game-attendance'
export default defineEventHandler(async (event) => { const gameId = z.uuid().parse(event.context.params?.id); const { adminClient } = await requireCoachGame(event, gameId); return { players: await getGamePlayers(adminClient, gameId) } })
