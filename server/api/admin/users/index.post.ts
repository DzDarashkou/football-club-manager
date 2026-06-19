import { readBody } from 'h3'
import {
  adminUserCreateSchema,
  handleApiError,
  mapProfileRow,
  requireAdminAccess,
  sendSetupEmail,
} from '@@/server/utils/admin-users'
import type { AdminUserMutationResponse } from '@@/types/admin-users'

export default defineEventHandler(async (event): Promise<AdminUserMutationResponse> => {
  const { adminClient } = await requireAdminAccess(event)
  const payload = adminUserCreateSchema.parse(await readBody(event))

  try {
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: payload.email,
      email_confirm: true,
      user_metadata: {
        full_name: payload.full_name,
      },
    })

    if (authError) {
      handleApiError(authError, 'Unable to create the auth account.', 400)
    }

    const authUserId = authData.user?.id

    if (!authUserId) {
      handleApiError(new Error('Supabase did not return the new user id.'), 'Unable to create the auth account.')
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .insert({
        id: authUserId,
        email: payload.email,
        role: payload.role,
        status: payload.status,
        full_name: payload.full_name,
      })
      .select('id, email, role, status, full_name, created_at, updated_at')
      .single()

    if (profileError) {
      await adminClient.auth.admin.deleteUser(authUserId)
      handleApiError(profileError, 'Unable to create the user profile.', 400)
    }

    const emailResult = await sendSetupEmail(event, adminClient, payload.email)

    return {
      user: mapProfileRow(profile),
      ...emailResult,
    }
  }
  catch (error) {
    handleApiError(error, 'Unable to create the user.', 400)
  }
})
