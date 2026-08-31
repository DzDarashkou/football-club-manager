import { readBody } from 'h3'
import { venueSchema } from '@@/server/utils/admin-games'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
export default defineEventHandler(async (event) => { const { adminClient } = await requireAdminAccess(event); const payload = venueSchema.parse(await readBody(event)); try { const { data, error } = await adminClient.from('venues').insert(payload).select('id, name, address, city, is_active').single(); if (error) handleApiError(error, 'Unable to create venue.', 400); return { venue: data } } catch (error) { handleApiError(error, 'Unable to create venue.', 400) } })
