import { requireCalendarAccess } from '@@/server/utils/game-attendance'
import { standingsQuerySchema, validateStandingsInput } from '@@/server/utils/standings'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireCalendarAccess(event)
  const query = validateStandingsInput(standingsQuerySchema, getQuery(event))
  let request = adminClient.from('standings_snapshots')
    .select('id, group_id, imported_at, external_team_id, table_data')
    .eq('group_id', query.group_id)
  if (query.snapshot_id) request = request.eq('id', query.snapshot_id)
  const { data, error } = await request.order('imported_at', { ascending: false }).order('id', { ascending: false }).limit(1).maybeSingle()
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load standings.' })
  if (query.snapshot_id && !data) throw createError({ statusCode: 404, statusMessage: 'Standings snapshot not found.' })
  return { snapshot: data }
})
