import { ageGroupUpdateSchema, recordIdSchema } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireAdminAccess(event)
  const id = recordIdSchema.parse(event.context.params?.id)
  const payload = ageGroupUpdateSchema.parse(await readBody(event))
  try {
    const { data, error } = await adminClient.from('age_groups').update(payload).eq('id', id).select('id').maybeSingle()
    if (error) handleApiError(error, 'Unable to update the age group.', 400)
    if (!data) throw createError({ statusCode: 404, statusMessage: 'Age group not found.' })
    return { success: true }
  } catch (error) { handleApiError(error, 'Unable to update the age group.', 400) }
})
