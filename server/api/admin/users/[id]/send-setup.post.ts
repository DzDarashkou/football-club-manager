import {
  adminUserIdSchema,
  getManagedUserById,
  handleApiError,
  requireAdminAccess,
  sendSetupEmail,
} from '@@/server/utils/admin-users'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireAdminAccess(event)
  const userId = adminUserIdSchema.parse(event.context.params?.id)

  try {
    const user = await getManagedUserById(adminClient, userId)
    const emailResult = await sendSetupEmail(event, adminClient, user.email)

    if (!emailResult.setupEmailSent) {
      handleApiError(new Error(emailResult.setupEmailError || 'Unable to send the setup email.'), 'Unable to send the setup email.', 400)
    }

    return emailResult
  }
  catch (error) {
    handleApiError(error, 'Unable to send the setup email.', 400)
  }
})
