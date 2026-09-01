import { createError } from 'h3'
import { handleApiError } from '@@/server/utils/admin-users'
import type { Database } from '@@/types/database'
import { serverSupabaseServiceRole } from '#supabase/server'

type AdminClient = ReturnType<typeof serverSupabaseServiceRole<Database>>
type DeletableTable = 'age_groups' | 'teams' | 'players' | 'games' | 'seasons' | 'competitions' | 'venues'

export async function deleteAdminRecord(adminClient: AdminClient, table: DeletableTable, id: string, label: string) {
  try {
    const { data, error } = await adminClient.from(table).delete().eq('id', id).select('id').maybeSingle()
    if (error) handleApiError(error, `Unable to delete the ${label}.`, 400)
    if (!data) throw createError({ statusCode: 404, statusMessage: `${label[0]?.toUpperCase()}${label.slice(1)} not found.` })
    return { success: true }
  }
  catch (error) {
    handleApiError(error, `Unable to delete the ${label}.`, 400)
  }
}
