import { z } from 'zod'
import { getGames } from '@@/server/utils/admin-games'
import { requireAdminAccess } from '@@/server/utils/admin-users'

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireAdminAccess(event)
  const game = (await getGames(adminClient)).find((item) => item.id === gameId)
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Game not found.' })
  const { data, error } = await adminClient.from('players').select('id, full_name, shirt_number').eq('team_id', game.team_id).eq('is_active', true).order('full_name')
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load team players.' })
  return { players: data ?? [] }
})
