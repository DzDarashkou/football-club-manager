<script setup lang="ts">
import { computed, ref } from 'vue'
import { UserRound } from 'lucide-vue-next'
import type { AdminPlayersResponse } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin', 'coach'] })

const selectClass = 'flex min-h-[44px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
const nameFilter = ref('')
const teamFilter = ref('all')
const { data, pending, error } = await useFetch<AdminPlayersResponse>('/api/coach/players', { default: () => ({ players: [] }) })
const players = computed(() => data.value?.players ?? [])
const teams = computed(() => {
  const uniqueTeams = new Map(players.value.flatMap((player) => player.teams.map((team) => [team.id, team] as const)))
  return [...uniqueTeams.values()].sort((first, second) => first.name.localeCompare(second.name, 'pl'))
})
const filteredPlayers = computed(() => {
  const normalizedName = nameFilter.value.trim().toLocaleLowerCase('pl-PL')

  return players.value.filter((player) => {
    const matchesTeam = teamFilter.value === 'all' || player.teams.some((team) => team.id === teamFilter.value)
    const matchesName = !normalizedName || player.full_name.toLocaleLowerCase('pl-PL').includes(normalizedName)
    return matchesTeam && matchesName
  })
})
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="space-y-2"><p class="eyebrow text-brand-700">Strefa trenera</p><h1>Zawodnicy</h1><p class="text-body text-[color:var(--color-text-secondary)]">Zawodnicy z przypisanych Ci drużyn.</p></div>
    <p v-if="error" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ error.statusMessage || 'Nie udało się wczytać zawodników.' }}</p>
    <Card class="grid gap-3 sm:grid-cols-2">
      <div>
        <Label for="coach-player-name-filter">Szukaj zawodnika</Label>
        <Input id="coach-player-name-filter" v-model="nameFilter" placeholder="Imię i nazwisko" />
      </div>
      <div>
        <Label for="coach-player-team-filter">Drużyna</Label>
        <select id="coach-player-team-filter" v-model="teamFilter" :class="selectClass">
          <option value="all">Wszystkie drużyny</option>
          <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
        </select>
      </div>
    </Card>
    <Card class="overflow-hidden p-0">
      <div v-if="pending" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Wczytywanie zawodników...</div>
      <p v-else-if="!players.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Brak zawodników w przypisanych drużynach.</p>
      <p v-else-if="!filteredPlayers.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Żaden zawodnik nie spełnia wybranych filtrów.</p>
      <NuxtLink v-for="player in filteredPlayers" :key="player.id" :to="`/coach/players/${player.id}`" class="flex items-center gap-3 border-b border-border p-4 last:border-b-0 hover:bg-brand-50/50">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserRound class="h-5 w-5" /></div>
        <div class="min-w-0"><p class="font-medium">{{ player.full_name }}{{ player.shirt_number ? ` · #${player.shirt_number}` : '' }}</p><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ player.teams.map((team) => `${team.name} · ${team.age_group.name}`).join(', ') }}</p></div>
        <Badge class="ml-auto" :status="player.is_active ? 'confirmed' : 'neutral'">{{ player.is_active ? 'Aktywny' : 'Nieaktywny' }}</Badge>
      </NuxtLink>
    </Card>
  </div>
</template>
