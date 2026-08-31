import { readBody } from 'h3'
import { ageGroupCreateSchema } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminAgeGroup } from '@@/types/admin-club'

export default defineEventHandler(async (event): Promise<{ ageGroup: AdminAgeGroup }> => {
  const { adminClient } = await requireAdminAccess(event)
  const payload = ageGroupCreateSchema.parse(await readBody(event))
  try {
    const { data, error } = await adminClient.from('age_groups').insert(payload)
      .select('id, name, birth_year_from, birth_year_to, is_active, created_at, updated_at').single()
    if (error) handleApiError(error, 'Unable to create the age group.', 400)
    return { ageGroup: data }
  }
  catch (error) {
    handleApiError(error, 'Unable to create the age group.', 400)
  }
})
