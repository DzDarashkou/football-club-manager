import {
  adminUserIdSchema,
  getManagedUserById,
  handleApiError,
  requireAdminAccess,
} from '@@/server/utils/admin-users'

export default defineEventHandler(async (event) => {
  const { adminClient, actorId } = await requireAdminAccess(event)
  const userId = adminUserIdSchema.parse(event.context.params?.id)

  if (userId === actorId) {
    handleApiError(new Error('Administrators cannot delete their own account.'), 'Unable to delete the user.', 403)
  }

  try {
    await getManagedUserById(adminClient, userId)

    const { error } = await adminClient.auth.admin.deleteUser(userId)

    if (error) {
      handleApiError(error, 'Unable to permanently delete the user.', 400)
    }

    return {
      success: true,
    }
  }
  catch (error) {
    handleApiError(error, 'Unable to delete the user.', 400)
  }
})
