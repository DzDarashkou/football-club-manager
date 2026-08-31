import { getAgeGroups } from '@@/server/utils/admin-club'
import { requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminAgeGroupsResponse } from '@@/types/admin-club'

export default defineEventHandler(async (event): Promise<AdminAgeGroupsResponse> => {
  const { adminClient } = await requireAdminAccess(event)
  return { ageGroups: await getAgeGroups(adminClient) }
})
