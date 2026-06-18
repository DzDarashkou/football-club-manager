import { watch } from 'vue'

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const supabaseUser = useSupabaseUser()

  watch(
    () => supabaseUser.value?.id ?? supabaseUser.value?.sub ?? null,
    async (userId, previousUserId) => {
      if (userId === previousUserId) {
        return
      }

      if (!userId) {
        authStore.reset()
        return
      }

      try {
        await authStore.initialize({ force: true })
      }
      catch {
        authStore.reset()
      }
    },
    { immediate: true },
  )
})
