import { getRoleHome, isPublicPath } from '@@/lib/auth'
import type { AppRole } from '@@/types/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  try {
    await authStore.initialize()
  }
  catch {
    if (!isPublicPath(to.path)) {
      return navigateTo('/login')
    }
  }

  const isPublicRoute = to.meta.public === true || isPublicPath(to.path)
  const blockedReason = authStore.authError?.includes('inactive') ? 'inactive' : null

  if (isPublicRoute) {
    if (to.path === '/login' && authStore.isAuthenticated && authStore.role) {
      return navigateTo(getRoleHome(authStore.role))
    }

    if (to.path === '/') {
      return navigateTo(authStore.isAuthenticated && authStore.role ? getRoleHome(authStore.role) : '/login')
    }

    return
  }

  if (!authStore.isAuthenticated || !authStore.role) {
    return navigateTo(blockedReason ? `/login?reason=${blockedReason}` : '/login')
  }

  // Installed PWAs commonly resume the last URL. These routes were former
  // role landing pages but only render static design placeholders, so never
  // allow a resumed session to land there instead of a real data view.
  if (
    (authStore.role === 'parent' && to.path === '/dashboard')
    || (authStore.role === 'coach' && to.path === '/coach')
  ) {
    return navigateTo(getRoleHome(authStore.role))
  }

  const allowedRoles = to.meta.allowedRoles as AppRole[] | undefined

  if (allowedRoles && !allowedRoles.includes(authStore.role)) {
    return navigateTo(getRoleHome(authStore.role))
  }
})
