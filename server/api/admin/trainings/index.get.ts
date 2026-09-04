import { getTrainingSessions } from '@@/server/utils/admin-trainings'
import { requireAdminAccess } from '@@/server/utils/admin-users'
export default defineEventHandler(async (event) => ({ trainings: await getTrainingSessions((await requireAdminAccess(event)).adminClient) }))
