import { requireCalendarAccess } from '@@/server/utils/game-attendance'
import { standingsQuerySchema, validateStandingsInput } from '@@/server/utils/standings'
import type { StandingsHistory } from '@@/types/standings'

export default defineEventHandler(async (event): Promise<StandingsHistory> => {
  const { adminClient } = await requireCalendarAccess(event)
  const query = validateStandingsInput(standingsQuerySchema, getQuery(event))
  const offset = query.page * 25
  const { data, error } = await adminClient.from('standings_snapshots').select('id, imported_at')
    .eq('group_id', query.group_id).order('imported_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 25)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load standings history.' })
  return { snapshots: (data ?? []).slice(0, 25), hasMore: (data?.length ?? 0) > 25 }
})
