<!-- App root renders the active layout shell and page content. -->
<script setup lang="ts">
const isRouteLoading = ref(false)
const nuxtApp = useNuxtApp()

nuxtApp.hook('page:loading:start', () => {
  isRouteLoading.value = true
})

nuxtApp.hook('page:loading:end', () => {
  isRouteLoading.value = false
})
</script>

<template>
  <NuxtRouteAnnouncer />
  <div
    v-if="isRouteLoading"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-brand-800/10"
    role="status"
    aria-label="Loading page"
    aria-busy="true"
  >
    <img src="/images/logo-trans.png" alt="" class="route-loading-logo h-28 w-28 opacity-30 sm:h-36 sm:w-36" />
  </div>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
@keyframes route-loading-heartbeat {
  0%, 100% { transform: scale(1); }
  20% { transform: scale(1.12); }
  40% { transform: scale(1); }
  60% { transform: scale(1.06); }
}

.route-loading-logo {
  animation: route-loading-heartbeat 1.3s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .route-loading-logo { animation: none; }
}
</style>
