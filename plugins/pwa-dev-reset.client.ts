/**
 * Clears stale service workers and caches during local development so old PWA
 * assets do not blank the app after large UI/config changes.
 */
export default defineNuxtPlugin(async () => {
  if (!import.meta.dev || !('serviceWorker' in navigator)) {
    return
  }

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(registrations.map((registration) => registration.unregister()))

  if ('caches' in window) {
    const cacheKeys = await window.caches.keys()
    await Promise.all(cacheKeys.map((key) => window.caches.delete(key)))
  }
})
