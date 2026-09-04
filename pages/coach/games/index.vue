<script setup lang="ts">
import type { AdminGame } from '@@/types/admin-club'
import { usePolishLocale } from '@@/composables/usePolishLocale'

definePageMeta({ allowedRoles: ['admin', 'coach'] })

const { data, pending, error } = await useFetch<{ games: AdminGame[] }>('/api/coach/games', {
  default: () => ({ games: [] }),
})
const { locationLabel } = usePolishLocale()
const activeList = ref<'upcoming' | 'past'>('upcoming')
const now = new Date()

const upcomingGames = computed(() => (data.value?.games ?? [])
  .filter((game) => new Date(game.scheduled_at) >= now)
  .sort((first, second) => new Date(first.scheduled_at).getTime() - new Date(second.scheduled_at).getTime()))

const pastGames = computed(() => (data.value?.games ?? [])
  .filter((game) => new Date(game.scheduled_at) < now)
  .sort((first, second) => new Date(second.scheduled_at).getTime() - new Date(first.scheduled_at).getTime()))

const displayedGames = computed(() => activeList.value === 'upcoming' ? upcomingGames.value : pastGames.value)

function format(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="space-y-2">
      <p class="eyebrow text-brand-700">Strefa trenera</p>
      <h1>Mecze</h1>
      <p class="text-body text-[color:var(--color-text-secondary)]">Wybierz kadrę, sprawdź odpowiedzi rodziców i zapisuj statystyki meczu.</p>
    </div>

    <p v-if="error" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">
      {{ error.statusMessage || 'Nie udało się wczytać meczów.' }}
    </p>

    <Card class="overflow-hidden p-0">
      <div v-if="pending" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Wczytywanie meczów...</div>
      <div v-else-if="!data?.games.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Do Twoich drużyn nie przypisano meczów.</div>
      <template v-else>
        <div class="border-b border-border p-3 sm:p-4">
          <div role="tablist" aria-label="Lista meczów" class="grid grid-cols-2 gap-2 rounded-lg bg-brand-50 p-1">
            <button
              id="upcoming-games-tab"
              type="button"
              role="tab"
              :aria-selected="activeList === 'upcoming'"
              aria-controls="games-list"
              class="min-h-11 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
              :class="activeList === 'upcoming' ? 'bg-white text-brand-800 shadow-sm' : 'text-[color:var(--color-text-secondary)] hover:text-brand-800'"
              @click="activeList = 'upcoming'"
            >
              Nadchodzące ({{ upcomingGames.length }})
            </button>
            <button
              id="past-games-tab"
              type="button"
              role="tab"
              :aria-selected="activeList === 'past'"
              aria-controls="games-list"
              class="min-h-11 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
              :class="activeList === 'past' ? 'bg-white text-brand-800 shadow-sm' : 'text-[color:var(--color-text-secondary)] hover:text-brand-800'"
              @click="activeList = 'past'"
            >
              Minione ({{ pastGames.length }})
            </button>
          </div>
        </div>

        <div id="games-list" role="tabpanel" :aria-labelledby="`${activeList}-games-tab`">
          <p v-if="!displayedGames.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">
            {{ activeList === 'upcoming' ? 'Brak nadchodzących meczów.' : 'Brak minionych meczów.' }}
          </p>
          <NuxtLink
            v-for="game in displayedGames"
            :key="game.id"
            :to="`/coach/games/${game.id}`"
            class="block border-b border-border px-4 py-5 transition-colors last:border-b-0 even:bg-brand-50/40 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400"
          >
            <p class="font-medium">{{ game.team.name }} – {{ game.opponent_name }}</p>
            <p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ format(game.scheduled_at) }} · {{ locationLabel(game.location_type) }}</p>
          </NuxtLink>
        </div>
      </template>
    </Card>
  </div>
</template>
