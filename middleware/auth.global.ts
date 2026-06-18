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

  if (isPublicRoute) {
    if (to.path === '/login' && authStore.isAuthenticated && authStore.role) {
      return navigateTo(getRoleHome(authStore.role))
    }

    return
  }

  if (!authStore.isAuthenticated || !authStore.role) {
    return navigateTo('/login')
  }

  const allowedRoles = to.meta.allowedRoles as AppRole[] | undefined

  if (allowedRoles && !allowedRoles.includes(authStore.role)) {
    return navigateTo(getRoleHome(authStore.role))
  }
})
