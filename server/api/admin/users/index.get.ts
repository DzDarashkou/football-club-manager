import { getQuery } from 'h3'
import { adminUserListQuerySchema, handleApiError, mapProfileRow, requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminUsersListResponse } from '@@/types/admin-users'

export default defineEventHandler(async (event): Promise<AdminUsersListResponse> => {
  const { adminClient } = await requireAdminAccess(event)
  const query = adminUserListQuerySchema.parse(getQuery(event))

  try {
    let request = adminClient
      .from('profiles')
      .select('id, email, role, status, full_name, created_at, updated_at')
      .in('role', ['coach', 'parent'])
      .order('created_at', { ascending: false })

    if (query.role !== 'all') {
      request = request.eq('role', query.role)
    }

    if (query.status !== 'all') {
      request = request.eq('status', query.status)
    }

    if (query.q) {
      const escapedQuery = query.q.replaceAll(',', '\\,')
      request = request.or(`email.ilike.%${escapedQuery}%,full_name.ilike.%${escapedQuery}%`)
    }

    const { data, error } = await request

    if (error) {
      handleApiError(error, 'Unable to load users.')
    }

    return {
      users: (data ?? []).map(mapProfileRow),
    }
  }
  catch (error) {
    handleApiError(error, 'Unable to load users.')
  }
})
