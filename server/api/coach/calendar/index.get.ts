import { getQuery } from 'h3'
import { z } from 'zod'
import { getGames } from '@@/server/utils/admin-games'
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
  const { adminClient } = await requireCalendarAccess(event)

  // The calendar is visible to every authenticated club member. Coach-specific
  // team scope can be applied here later without changing the calendar UI.
  const games = await getGames(adminClient, { startsAt, endsBefore, ascending: true })
  return { games }
})
