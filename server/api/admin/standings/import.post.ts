import { requireAdminAccess } from '@@/server/utils/admin-users'
import { readStandingsBody, validateStandingsInput } from '@@/server/utils/standings'
import { standingsImportSchema } from '@@/validators/standings'

export default defineEventHandler(async (event) => {
  const { actorId, adminClient } = await requireAdminAccess(event)
  const input = validateStandingsInput(standingsImportSchema, await readStandingsBody(event))
  const { data, error } = await adminClient.rpc('import_standings_snapshot', {
    p_group_id: input.group_id,
    p_actor_id: actorId,
    p_external_team_id: input.external_team_id,
    p_table: input.table,
  })
  if (error) throw createError({ statusCode: ['22023', '23505'].includes(error.code) ? 409 : 400, statusMessage: 'Unable to import standings.', data: { message: ['22023', '23505'].includes(error.code) ? 'JSON dotyczy innej grupy lub ta grupa rozgrywek jest już przypisana. Sprawdź wybraną grupę.' : 'Nie udało się zapisać tabeli. Sprawdź dane i spróbuj ponownie.' } })
  return { snapshotId: data }
})
