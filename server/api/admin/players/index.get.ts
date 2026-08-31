import { getQuery } from 'h3'
import { getPlayers, playerListQuerySchema } from '@@/server/utils/admin-club'
import { requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminPlayersResponse } from '@@/types/admin-club'

export default defineEventHandler(async (event): Promise<AdminPlayersResponse> => {
  const { adminClient } = await requireAdminAccess(event)
  return { players: await getPlayers(adminClient, playerListQuerySchema.parse(getQuery(event))) }
})
