import { venueUpdateSchema } from '@@/server/utils/admin-games'
import { recordIdSchema } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { Database } from '@@/types/database'
export default defineEventHandler(async (event) => { const { adminClient } = await requireAdminAccess(event); const id = recordIdSchema.parse(event.context.params?.id); const payload = venueUpdateSchema.parse(await readBody(event)) as Database['public']['Tables']['venues']['Update']; try { const { data, error } = await adminClient.from('venues').update(payload).eq('id', id).select('id').maybeSingle(); if (error) handleApiError(error, 'Unable to update the venue.', 400); if (!data) throw createError({ statusCode: 404, statusMessage: 'Venue not found.' }); return { success: true } } catch (error) { handleApiError(error, 'Unable to update the venue.', 400) } })
