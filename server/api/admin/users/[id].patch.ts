import { readBody } from 'h3'
import {
  adminUserIdSchema,
  adminUserUpdateSchema,
  getManagedUserById,
  handleApiError,
  mapProfileRow,
  requireAdminAccess,
} from '@@/server/utils/admin-users'
import type { AdminUserMutationResponse } from '@@/types/admin-users'

export default defineEventHandler(async (event): Promise<AdminUserMutationResponse> => {
  const { adminClient, actorId } = await requireAdminAccess(event)
  const userId = adminUserIdSchema.parse(event.context.params?.id)
  const payload = adminUserUpdateSchema.parse(await readBody(event))

  if (userId === actorId) {
    handleApiError(new Error('Administrators cannot edit their own account from this screen.'), 'Unable to update the user.', 403)
  }

  try {
    const existingUser = await getManagedUserById(adminClient, userId)
    const nextEmail = payload.email ?? existingUser.email
    const nextProfile = {
      email: nextEmail,
      full_name: payload.full_name ?? existingUser.full_name ?? '',
      role: payload.role ?? existingUser.role,
      status: payload.status ?? existingUser.status,
    }

    if (nextEmail !== existingUser.email) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
        email: nextEmail,
        email_confirm: true,
      })

      if (authUpdateError) {
        handleApiError(authUpdateError, 'Unable to update the user email.', 400)
      }
    }

    const { data: updatedProfile, error: profileError } = await adminClient
      .from('profiles')
      .update({
        email: nextProfile.email,
        full_name: nextProfile.full_name,
        role: nextProfile.role,
        status: nextProfile.status,
      })
      .eq('id', userId)
      .select('id, email, role, status, full_name, created_at, updated_at')
      .single()

    if (profileError) {
      if (nextEmail !== existingUser.email) {
        const { error: rollbackError } = await adminClient.auth.admin.updateUserById(userId, {
          email: existingUser.email,
          email_confirm: true,
        })

        if (rollbackError) {
          console.error('Unable to rollback auth email after profile update failure.', rollbackError)
        }
      }

      handleApiError(profileError, 'Unable to update the user profile.', 400)
    }

    return {
      user: mapProfileRow(updatedProfile),
    }
  }
  catch (error) {
    handleApiError(error, 'Unable to update the user.', 400)
  }
})
