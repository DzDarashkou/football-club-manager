import { readBody } from 'h3'
import { getTeams, recordIdSchema, requireActiveAgeGroup, teamUpdateSchema } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminTeam } from '@@/types/admin-club'

export default defineEventHandler(async (event): Promise<{ team: AdminTeam }> => {
  const { adminClient } = await requireAdminAccess(event)
  const teamId = recordIdSchema.parse(event.context.params?.id)
  const payload = teamUpdateSchema.parse(await readBody(event))
  try {
    if (payload.age_group_id) await requireActiveAgeGroup(adminClient, payload.age_group_id)
    const { data, error } = await adminClient.from('teams').update(payload).eq('id', teamId).select('id').maybeSingle()
    if (error) handleApiError(error, 'Unable to update the team.', 400)
    if (!data) handleApiError(new Error('Team not found.'), 'Unable to update the team.', 404)
    const team = (await getTeams(adminClient)).find((item) => item.id === teamId)
    if (!team) throw new Error('Updated team could not be loaded.')
    return { team }
  }
  catch (error) { handleApiError(error, 'Unable to update the team.', 400) }
})
