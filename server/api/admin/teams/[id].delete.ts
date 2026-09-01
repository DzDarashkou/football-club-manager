import { recordIdSchema } from '@@/server/utils/admin-club'
import { deleteAdminRecord } from '@@/server/utils/admin-delete'
import { requireAdminAccess } from '@@/server/utils/admin-users'
export default defineEventHandler(async (event) => deleteAdminRecord((await requireAdminAccess(event)).adminClient, 'teams', recordIdSchema.parse(event.context.params?.id), 'team'))
