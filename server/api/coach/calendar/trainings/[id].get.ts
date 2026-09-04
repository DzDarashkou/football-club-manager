import { z } from 'zod'
import { getTrainingSession } from '@@/server/utils/admin-trainings'
import { requireCalendarAccess } from '@@/server/utils/game-attendance'
import { getMatchWeather } from '@@/server/utils/match-weather'
import { openMeteoAttribution } from '@@/types/weather'

export default defineEventHandler(async (event) => {
  const id = z.uuid().parse(event.context.params?.id)
  const { adminClient, role, userId } = await requireCalendarAccess(event)
  const training = await getTrainingSession(adminClient, id)
  if (!training) throw createError({ statusCode: 404, statusMessage: 'Training not found.' })
  if (role === 'coach') {
    const { data } = await adminClient.from('coach_teams').select('team_id').eq('coach_id', userId).eq('team_id', training.team_id).maybeSingle()
    if (!data) throw createError({ statusCode: 403, statusMessage: 'You are not assigned to this team.' })
  }
  const weather = await getMatchWeather(adminClient, { gameId: training.id, kickoff: training.scheduled_at, status: training.status, city: training.venue?.city ?? null, latitude: training.venue?.latitude ?? null, longitude: training.venue?.longitude ?? null, expectedDurationMinutes: training.duration_minutes, cacheKind: 'training' })
  return { training, weather, weatherAttribution: openMeteoAttribution }
})
