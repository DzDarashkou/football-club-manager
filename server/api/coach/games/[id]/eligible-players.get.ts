import { z } from 'zod'
import { requireCoachGame } from '@@/server/utils/game-attendance'
export default defineEventHandler(async (event) => { const gameId = z.uuid().parse(event.context.params?.id); const { adminClient, game } = await requireCoachGame(event, gameId); const { data, error } = await adminClient.from('players').select('id, full_name').eq('team_id', game.team_id).eq('is_active', true).order('full_name'); if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load team players.' }); return { players: data ?? [] } })
