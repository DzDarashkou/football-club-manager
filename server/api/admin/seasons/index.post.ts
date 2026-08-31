import { readBody } from 'h3'
import { seasonSchema } from '@@/server/utils/admin-games'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
export default defineEventHandler(async (event) => { const { adminClient } = await requireAdminAccess(event); const payload = seasonSchema.parse(await readBody(event)); try { const { data, error } = await adminClient.from('seasons').insert(payload).select('id, name, starts_on, ends_on, is_active').single(); if (error) handleApiError(error, 'Unable to create season.', 400); return { season: data } } catch (error) { handleApiError(error, 'Unable to create season.', 400) } })
