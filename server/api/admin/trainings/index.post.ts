import { readBody } from 'h3'
import { trainingCreateSchema, validateTrainingReferences } from '@@/server/utils/admin-trainings'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireAdminAccess(event)
  const payload = trainingCreateSchema.parse(await readBody(event))
  try {
    await validateTrainingReferences(adminClient, payload)
    const { data, error } = await adminClient.rpc('create_training_series', {
      p_team_id: payload.team_id, p_venue_id: payload.venue_id, p_weekday: payload.weekday,
      p_starts_on: payload.starts_on, p_ends_on: payload.ends_on, p_starts_at: payload.starts_at,
      p_duration_minutes: payload.duration_minutes, p_notes: payload.notes,
    })
    if (error || !data) handleApiError(error, 'Nie udało się utworzyć treningów.', 400)
    return { seriesId: data }
  } catch (error) { handleApiError(error, 'Nie udało się utworzyć treningów.', 400) }
})
