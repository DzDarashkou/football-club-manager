/**
 * A PWA can keep its JavaScript state alive while it is backgrounded. Refresh
 * the restored session and Nuxt data when it becomes visible again so screens
 * do not continue showing an old payload after the access token has rotated.
 */
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  let refreshInFlight = false

  async function refreshAfterResume() {
    if (document.visibilityState !== 'visible' || refreshInFlight) {
      return
    }

    refreshInFlight = true

    try {
      await authStore.initialize({ force: true })

      if (authStore.isAuthenticated && authStore.role) {
        await refreshNuxtData()
      }
    }
    catch {
      // A phone can regain focus before it has reconnected. Keep the current
      // in-memory profile in that case; the normal auth-state handler remains
      // responsible for clearing it after an actual sign-out.
    }
    finally {
      refreshInFlight = false
    }
  }

  window.addEventListener('visibilitychange', () => {
    void refreshAfterResume()
  })
  window.addEventListener('pageshow', () => {
    void refreshAfterResume()
  })
})
