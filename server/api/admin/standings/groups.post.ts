import { requireAdminAccess } from '@@/server/utils/admin-users'
import { readStandingsBody, validateStandingsInput } from '@@/server/utils/standings'
import { standingsGroupSchema } from '@@/validators/standings'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireAdminAccess(event)
  const input = validateStandingsInput(standingsGroupSchema, await readStandingsBody(event))
  const { data, error } = await adminClient.from('team_competition_groups').insert(input)
    .select('id, team_id, season_id, name, external_play_id').single()
  if (error) throw createError({ statusCode: error.code === '23505' ? 409 : 400, statusMessage: 'Unable to create group.', data: { message: error.code === '23505' ? 'Ta grupa już istnieje dla wybranej drużyny i sezonu.' : 'Nie udało się dodać grupy. Sprawdź drużynę i sezon.' } })
  return { group: data }
})
