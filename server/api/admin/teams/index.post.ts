import { readBody } from 'h3'
import { getTeams, requireActiveAgeGroup, teamCreateSchema } from '@@/server/utils/admin-club'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminTeam } from '@@/types/admin-club'

export default defineEventHandler(async (event): Promise<{ team: AdminTeam }> => {
  const { adminClient } = await requireAdminAccess(event)
  const payload = teamCreateSchema.parse(await readBody(event))
  try {
    await requireActiveAgeGroup(adminClient, payload.age_group_id)
    const { data, error } = await adminClient.from('teams').insert(payload).select('id').single()
    if (error) handleApiError(error, 'Unable to create the team.', 400)
    const team = (await getTeams(adminClient)).find((item) => item.id === data.id)
    if (!team) throw new Error('Created team could not be loaded.')
    return { team }
  }
  catch (error) { handleApiError(error, 'Unable to create the team.', 400) }
})
