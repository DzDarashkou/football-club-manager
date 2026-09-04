import { z } from 'zod'
import { getGames } from '@@/server/utils/admin-games'
import { getGamePlayers, requireCalendarAccess } from '@@/server/utils/game-attendance'
import { getMatchWeather } from '@@/server/utils/match-weather'
import { openMeteoAttribution } from '@@/types/weather'

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireCalendarAccess(event)
  const game = (await getGames(adminClient, { includeAll: true })).find((item) => item.id === gameId)

  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found.' })

  const weather = await getMatchWeather(adminClient, { gameId: game.id, kickoff: game.scheduled_at, status: game.status, city: game.venue?.city ?? null, latitude: game.venue?.latitude ?? null, longitude: game.venue?.longitude ?? null })
  return { game, players: await getGamePlayers(adminClient, gameId), weather, weatherAttribution: openMeteoAttribution }
})
