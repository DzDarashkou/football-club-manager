import { readBody } from 'h3'
import { gameSchema, getGames, validateGameReferences } from '@@/server/utils/admin-games'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
export default defineEventHandler(async (event) => {
  const { adminClient } = await requireAdminAccess(event); const payload = gameSchema.parse(await readBody(event))
  try { await validateGameReferences(adminClient, payload); const { data, error } = await adminClient.from('games').insert({ ...payload, scheduled_at: new Date(payload.scheduled_at).toISOString() }).select('id').single(); if (error) handleApiError(error, 'Unable to create game.', 400); return { game: (await getGames(adminClient)).find((game) => game.id === data.id) } }
  catch (error) { handleApiError(error, 'Unable to create game.', 400) }
})
