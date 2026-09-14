import { requireCalendarAccess } from '@@/server/utils/game-attendance'
import type { StandingsSetup } from '@@/types/standings'

export default defineEventHandler(async (event): Promise<StandingsSetup> => {
  const { adminClient } = await requireCalendarAccess(event)
  const [teams, seasons, groups] = await Promise.all([
    adminClient.from('teams').select('id, name').order('name'),
    adminClient.from('seasons').select('id, name').order('starts_on', { ascending: false }),
    adminClient.from('team_competition_groups').select('id, team_id, season_id, name, external_play_id').order('name'),
  ])
  if (teams.error || seasons.error || groups.error) throw createError({ statusCode: 500, statusMessage: 'Unable to load competition groups.' })
  return { teams: teams.data ?? [], seasons: seasons.data ?? [], groups: groups.data ?? [] }
})
