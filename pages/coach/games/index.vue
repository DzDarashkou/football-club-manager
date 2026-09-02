<script setup lang="ts">
import type { AdminGame } from '@@/types/admin-club'
import { usePolishLocale } from '@@/composables/usePolishLocale'

definePageMeta({ allowedRoles: ['admin', 'coach'] })

const { data, pending, error } = await useFetch<{ games: AdminGame[] }>('/api/coach/games', {
  default: () => ({ games: [] }),
})
const { locationLabel } = usePolishLocale()

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
      <NuxtLink v-for="game in data?.games" :key="game.id" :to="`/coach/games/${game.id}`" class="block border-b border-border px-4 py-5 last:border-b-0 hover:bg-brand-50/50">
        <p class="font-medium">{{ game.team.name }} – {{ game.opponent_name }}</p>
        <p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ format(game.scheduled_at) }} · {{ locationLabel(game.location_type) }}</p>
      </NuxtLink>
    </Card>
  </div>
</template>
