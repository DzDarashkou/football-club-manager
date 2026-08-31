import { getGames } from '@@/server/utils/admin-games'
import { requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminGamesResponse } from '@@/types/admin-club'
export default defineEventHandler(async (event): Promise<AdminGamesResponse> => ({ games: await getGames((await requireAdminAccess(event)).adminClient) }))
