import { competitionUpdateSchema } from '@@/server/utils/admin-games'
import { recordIdSchema } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { Database } from '@@/types/database'
export default defineEventHandler(async (event) => { const { adminClient } = await requireAdminAccess(event); const id = recordIdSchema.parse(event.context.params?.id); const payload = competitionUpdateSchema.parse(await readBody(event)) as Database['public']['Tables']['competitions']['Update']; try { const { data, error } = await adminClient.from('competitions').update(payload).eq('id', id).select('id').maybeSingle(); if (error) handleApiError(error, 'Unable to update the competition.', 400); if (!data) throw createError({ statusCode: 404, statusMessage: 'Competition not found.' }); return { success: true } } catch (error) { handleApiError(error, 'Unable to update the competition.', 400) } })
