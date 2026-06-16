/**
 * Derives the active shell role from the current route so layouts can stay
 * declarative and role-aware.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export type LayoutRole = 'public' | 'parent' | 'coach' | 'admin'

export function useLayout() {
  const route = useRoute()

  const role = computed<LayoutRole>(() => {
    const path = route.path
    if (path.startsWith('/admin')) {
      return 'admin'
    }
    if (path.startsWith('/coach')) {
      return 'coach'
    }
    if (path === '/' || path === '/login' || path === '/forgot-password') {
      return 'public'
    }
    return 'parent'
  })

  const hasTopbar = computed(() => role.value !== 'public')
  const hasBottomNav = computed(() => role.value === 'parent' || role.value === 'coach')
  const hasSidebar = computed(() => role.value === 'admin')

  return { role, hasTopbar, hasBottomNav, hasSidebar }
}
