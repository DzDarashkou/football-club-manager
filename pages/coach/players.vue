<script setup lang="ts">
import { computed } from 'vue'
import { UserRound } from 'lucide-vue-next'
import type { AdminPlayersResponse } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin', 'coach'] })

const { data, pending, error } = await useFetch<AdminPlayersResponse>('/api/coach/players', { default: () => ({ players: [] }) })
const players = computed(() => data.value?.players ?? [])
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="space-y-2"><p class="eyebrow text-brand-700">Coach area</p><h1>Players</h1><p class="text-body text-[color:var(--color-text-secondary)]">Players from your assigned teams.</p></div>
    <p v-if="error" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ error.statusMessage || 'Unable to load players.' }}</p>
    <Card class="overflow-hidden p-0"><div v-if="pending" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Loading players...</div><p v-else-if="!players.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">No players are available for your teams.</p><NuxtLink v-for="player in players" :key="player.id" :to="`/coach/players/${player.id}`" class="flex items-center gap-3 border-b border-border p-4 last:border-b-0 hover:bg-brand-50/50"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserRound class="h-5 w-5" /></div><div class="min-w-0"><p class="font-medium">{{ player.full_name }}{{ player.shirt_number ? ` · #${player.shirt_number}` : '' }}</p><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ player.team.name }} · {{ player.team.age_group.name }}</p></div><Badge class="ml-auto" :status="player.is_active ? 'confirmed' : 'neutral'">{{ player.is_active ? 'Active' : 'Inactive' }}</Badge></NuxtLink></Card>
  </div>
</template>
