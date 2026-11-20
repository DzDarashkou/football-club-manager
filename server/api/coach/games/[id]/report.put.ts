import { z } from 'zod'
import { handleApiError } from '@@/server/utils/admin-users'
import { requireCoachGame } from '@@/server/utils/game-attendance'
import { gameReportSchema, saveGameReport } from '@@/server/utils/game-reports'
import type { GameLocationType } from '@@/types/admin-club'

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireCoachGame(event, gameId)
  const payload = gameReportSchema.parse(await readBody(event))

  const { data: game, error } = await adminClient
    .from('games')
    .select('location_type')
    .eq('id', gameId)
    .maybeSingle()

  if (error || !game)
    handleApiError(error ?? new Error('Game not found'), 'Game not found.', 404)

  return await saveGameReport(
    adminClient,
    gameId,
    game.location_type as GameLocationType,
    payload,
  )
})
