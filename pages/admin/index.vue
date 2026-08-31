<script setup lang="ts">
import { computed } from 'vue'
import type { AdminTeam } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin'] })

type AdminOverviewResponse = { teamCount: number, playerCount: number, coachCount: number, teams: AdminTeam[] }
const { data, pending } = await useFetch<AdminOverviewResponse>('/api/admin/overview', { default: () => ({ teamCount: 0, playerCount: 0, coachCount: 0, teams: [] }) })
const overview = computed(() => data.value ?? { teamCount: 0, playerCount: 0, coachCount: 0, teams: [] })
const metrics = computed(() => [
  { label: 'Teams', value: overview.value.teamCount },
  { label: 'Players', value: overview.value.playerCount },
  { label: 'Coaches', value: overview.value.coachCount },
])
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <div class="space-y-2"><h1>Club overview</h1><p class="text-body text-[color:var(--color-text-secondary)]">Current club structure</p></div>
    <div class="grid gap-4 sm:grid-cols-3"><Card v-for="metric in metrics" :key="metric.label" class="space-y-3"><p class="text-h2 text-[color:var(--color-text-secondary)]">{{ metric.label }}</p><p class="text-[40px] font-medium leading-none text-[color:var(--color-text-primary)]">{{ pending ? '—' : metric.value }}</p></Card></div>
    <section class="space-y-4"><div class="flex items-center justify-between gap-4"><h2>Teams</h2><Button as="NuxtLink" to="/admin/teams" variant="outline" size="sm">Manage teams</Button></div><Card class="overflow-hidden p-0"><div v-if="pending" class="px-4 py-8 text-center text-sm text-[color:var(--color-text-secondary)]">Loading club overview...</div><div v-else-if="!overview.teams.length" class="px-4 py-8 text-center text-sm text-[color:var(--color-text-secondary)]">No teams have been created yet.</div><div v-for="team in overview.teams" :key="team.id" class="grid gap-2 border-b border-border px-4 py-5 last:border-b-0 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p class="text-h2">{{ team.name }}</p><p class="mt-1 text-label text-[color:var(--color-text-secondary)]">{{ team.age_group.name }} · {{ team.age_group.birth_year_from }}–{{ team.age_group.birth_year_to }}</p></div><p class="text-body text-[color:var(--color-text-secondary)]">{{ team.player_count }} players</p><Badge :status="team.is_active ? 'confirmed' : 'neutral'">{{ team.is_active ? 'Active' : 'Inactive' }}</Badge></div></Card></section>
  </div>
</template>
