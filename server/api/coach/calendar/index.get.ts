import { getQuery } from 'h3'
import { z } from 'zod'
import { getGames } from '@@/server/utils/admin-games'
import { getTrainingSessions } from '@@/server/utils/admin-trainings'
import { requireCalendarAccess } from '@@/server/utils/game-attendance'

const dateTime = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'A valid date is required.')
const querySchema = z.object({
  starts_at: dateTime,
  ends_before: dateTime,
}).refine((value) => new Date(value.ends_before) > new Date(value.starts_at), {
  message: 'The end date must be after the start date.',
})

export default defineEventHandler(async (event) => {
  const { starts_at: startsAt, ends_before: endsBefore } = querySchema.parse(getQuery(event))
  const { adminClient, role, userId } = await requireCalendarAccess(event)

  // The calendar is visible to every authenticated club member. Coach-specific
  // team scope can be applied here later without changing the calendar UI.
  const [games, trainings] = await Promise.all([
    getGames(adminClient, { startsAt, endsBefore, ascending: true }),
    getTrainingSessions(adminClient, startsAt, endsBefore),
  ])
  let allowedTeamIds: Set<string> | null = null
  if (role === 'coach') {
    const { data, error } = await adminClient.from('coach_teams').select('team_id').eq('coach_id', userId)
    if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load coach teams.' })
    allowedTeamIds = new Set((data ?? []).map(item => item.team_id))
  } else if (role === 'parent') {
    const { data, error } = await adminClient.from('player_parents').select('players!inner(team_id)').eq('parent_id', userId)
    if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load parent teams.' })
    allowedTeamIds = new Set((data ?? []).map(item => (item.players as unknown as { team_id: string }).team_id))
  }
  const permitted = <T extends { team_id: string }>(items: T[]) => allowedTeamIds ? items.filter(item => allowedTeamIds!.has(item.team_id)) : items
  return { games: permitted(games), trainings: permitted(trainings) }
})
