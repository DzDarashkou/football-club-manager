import { storeToRefs } from 'pinia'

export function useAppAuth() {
  const authStore = useAuthStore()
  const refs = storeToRefs(authStore)

  return {
    ...refs,
    initialize: authStore.initialize,
    reset: authStore.reset,
    signInWithPassword: authStore.signInWithPassword,
    signOut: authStore.signOut,
  }
}
