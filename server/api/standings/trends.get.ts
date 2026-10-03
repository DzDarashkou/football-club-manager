import { requireCalendarAccess } from '@@/server/utils/game-attendance'
import {
  standingsQuerySchema,
  validateStandingsInput,
} from '@@/server/utils/standings'
import { standingsTableSchema } from '@@/validators/standings'
import type { StandingsTrends } from '@@/types/standings'

export default defineEventHandler(async (event): Promise<StandingsTrends> => {
  const { adminClient } = await requireCalendarAccess(event)
  const query = validateStandingsInput(standingsQuerySchema, getQuery(event))
  const offset = query.page * 25
  const { data, error } = await adminClient
    .from('standings_snapshots')
    .select('id, imported_at, external_team_id, table_data')
    .eq('group_id', query.group_id)
    .order('imported_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + 25)
  if (error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to load standings trends.',
    })
  return {
    snapshots: (data ?? []).slice(0, 25).map((snapshot) => {
      const parsed = standingsTableSchema.safeParse(snapshot.table_data)
      if (!parsed.success)
        throw createError({
          statusCode: 500,
          statusMessage: 'Invalid stored standings data.',
        })
      return {
        id: snapshot.id,
        imported_at: snapshot.imported_at,
        external_team_id: snapshot.external_team_id,
        teams: parsed.data.rows.map((row) => ({
          id: row.team.id,
          name: row.team.name,
          points: row.stats.points,
          position: row.index,
        })),
      }
    }),
    hasMore: (data?.length ?? 0) > 25,
  }
})
