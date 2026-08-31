import { getGameSetup } from '@@/server/utils/admin-games'
import { requireAdminAccess } from '@@/server/utils/admin-users'
export default defineEventHandler(async (event) => getGameSetup((await requireAdminAccess(event)).adminClient))
