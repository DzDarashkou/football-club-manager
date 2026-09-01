<!-- App root renders the active layout shell and page content. -->
<script setup lang="ts">
import { Download, Share, X } from 'lucide-vue-next'

const isRouteLoading = ref(false)
const isIosInstallGuideVisible = ref(false)
const nuxtApp = useNuxtApp()
const pwa = usePWA()

onMounted(() => {
  const isAppleMobileDevice = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  // Safari does not provide `beforeinstallprompt`, so it needs explicit steps.
  isIosInstallGuideVisible.value = isAppleMobileDevice && !isStandalone
})

async function installApp() {
  await pwa?.install()
}

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

  <aside
    v-if="pwa?.showInstallPrompt"
    class="fixed inset-x-4 bottom-4 z-[110] mx-auto max-w-md rounded-xl border border-brand-100 bg-white p-4 shadow-xl"
    role="dialog"
    aria-label="Install Sporting Wroclaw app"
  >
    <button
      type="button"
      class="absolute right-2 top-2 rounded-md p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      aria-label="Dismiss install prompt"
      @click="pwa?.cancelInstall()"
    >
      <X class="h-4 w-4" aria-hidden="true" />
    </button>
    <div class="flex items-start gap-3 pr-8">
      <img src="/images/logo-trans.png" alt="" class="h-12 w-12 shrink-0" />
      <div>
        <p class="font-medium text-foreground">Install Sporting Wroclaw</p>
        <p class="mt-1 text-sm text-muted-foreground">Add the app to your home screen for quicker access.</p>
      </div>
    </div>
    <button
      type="button"
      class="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      @click="installApp"
    >
      <Download class="h-4 w-4" aria-hidden="true" />
      Install app
    </button>
  </aside>

  <aside
    v-if="isIosInstallGuideVisible"
    class="fixed inset-x-4 bottom-4 z-[110] mx-auto max-w-md rounded-xl border border-brand-100 bg-white p-4 shadow-xl"
    role="dialog"
    aria-label="Install Sporting Wroclaw app on iPhone or iPad"
  >
    <button
      type="button"
      class="absolute right-2 top-2 rounded-md p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
      aria-label="Dismiss install instructions"
      @click="isIosInstallGuideVisible = false"
    >
      <X class="h-4 w-4" aria-hidden="true" />
    </button>
    <div class="flex items-start gap-3 pr-8">
      <img src="/images/logo-trans.png" alt="" class="h-12 w-12 shrink-0" />
      <div>
        <p class="font-medium text-foreground">Install Sporting Wroclaw</p>
        <p class="mt-1 text-sm text-muted-foreground">In Safari, tap Share, then choose “Add to Home Screen”.</p>
      </div>
    </div>
    <div class="mt-4 flex items-center gap-2 text-sm font-medium text-brand-800">
      <Share class="h-4 w-4" aria-hidden="true" />
      Add to Home Screen
    </div>
  </aside>
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
