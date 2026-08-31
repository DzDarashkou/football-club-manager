import { getTeams } from '@@/server/utils/admin-club'
import { requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminTeamsResponse } from '@@/types/admin-club'

export default defineEventHandler(async (event): Promise<AdminTeamsResponse> => {
  const { adminClient } = await requireAdminAccess(event)
  return { teams: await getTeams(adminClient) }
})
