<script setup lang="ts">
import type { AdminGame } from '@@/types/admin-club'
definePageMeta({ allowedRoles: ['admin', 'coach'] })
const { data, pending } = await useFetch<{ games: AdminGame[] }>('/api/coach/games', { default: () => ({ games: [] }) })
function format(value: string) { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
</script>
<template>
  <div class="mx-auto max-w-3xl space-y-6"><div class="space-y-2"><p class="eyebrow text-brand-700">Coach area</p><h1>Games</h1><p class="text-body text-[color:var(--color-text-secondary)]">Select your squad, review parent responses, and record match statistics.</p></div><Card class="overflow-hidden p-0"><div v-if="pending" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Loading games...</div><div v-else-if="!data?.games.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">No games are assigned to your teams.</div><NuxtLink v-for="game in data?.games" :key="game.id" :to="`/coach/games/${game.id}`" class="block border-b border-border px-4 py-5 last:border-b-0 hover:bg-brand-50/50"><p class="font-medium">{{ game.team.name }} vs {{ game.opponent_name }}</p><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ format(game.scheduled_at) }} · {{ game.location_type }}</p></NuxtLink></Card></div>
</template>
