import { readBody } from 'h3'
import { z } from 'zod'
import { requireCoachGame, statisticsSchema } from '@@/server/utils/game-attendance'
import { handleApiError } from '@@/server/utils/admin-users'
export default defineEventHandler(async (event) => { const gameId = z.uuid().parse(event.context.params?.id); const playerId = z.uuid().parse(event.context.params?.playerId); const { adminClient } = await requireCoachGame(event, gameId); const payload = statisticsSchema.parse(await readBody(event)); try { const { data, error } = await adminClient.from('game_players').update(payload).eq('game_id', gameId).eq('player_id', playerId).select('player_id').maybeSingle(); if (error) handleApiError(error, 'Unable to update player statistics.', 400); if (!data) handleApiError(new Error('Selected player not found.'), 'Unable to update player statistics.', 404); return { success: true } } catch (error) { handleApiError(error, 'Unable to update player statistics.', 400) } })
