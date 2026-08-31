import { getTeams } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'

type AdminOverviewResponse = {
  teamCount: number
  playerCount: number
  coachCount: number
  teams: Awaited<ReturnType<typeof getTeams>>
}

export default defineEventHandler(async (event): Promise<AdminOverviewResponse> => {
  const { adminClient } = await requireAdminAccess(event)
  const [teams, playerResult, coachResult] = await Promise.all([
    getTeams(adminClient),
    adminClient.from('players').select('*', { count: 'exact', head: true }),
    adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'coach').eq('status', 'active'),
  ])
  if (playerResult.error) handleApiError(playerResult.error, 'Unable to load player totals.')
  if (coachResult.error) handleApiError(coachResult.error, 'Unable to load coach totals.')
  return { teamCount: teams.length, playerCount: playerResult.count ?? 0, coachCount: coachResult.count ?? 0, teams: teams.slice(0, 5) }
})
