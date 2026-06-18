import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { isPublicPath } from '@@/lib/auth'
import type { AppRole } from '@@/types/auth'

export type LayoutRole = 'public' | AppRole

export function useLayout() {
  const route = useRoute()
  const { role: authRole } = useAppAuth()

  const role = computed<LayoutRole>(() => {
    if (route.meta.public === true || isPublicPath(route.path)) {
      return 'public'
    }

    return authRole.value ?? 'public'
  })

  const hasTopbar = computed(() => role.value !== 'public')
  const hasBottomNav = computed(() => role.value === 'parent' || role.value === 'coach')
  const hasSidebar = computed(() => role.value === 'admin')

  return { role, hasTopbar, hasBottomNav, hasSidebar }
}
