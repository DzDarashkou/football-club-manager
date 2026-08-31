import { readBody } from 'h3'
import { z } from 'zod'
import { availabilitySchema, requireParentGamePlayer } from '@@/server/utils/game-attendance'
import { handleApiError } from '@@/server/utils/admin-users'
export default defineEventHandler(async (event) => { const gameId = z.uuid().parse(event.context.params?.id); const playerId = z.uuid().parse(event.context.params?.playerId); const { adminClient } = await requireParentGamePlayer(event, gameId, playerId); const payload = availabilitySchema.parse(await readBody(event)); try { const { error } = await adminClient.from('game_players').update({ ...payload, responded_at: new Date().toISOString() }).eq('game_id', gameId).eq('player_id', playerId); if (error) handleApiError(error, 'Unable to update attendance.', 400); return { success: true } } catch (error) { handleApiError(error, 'Unable to update attendance.', 400) } })
