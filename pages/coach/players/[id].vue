<script setup lang="ts">
import { computed, ref } from 'vue'
import { Save, UserRound } from 'lucide-vue-next'
import type { AdminGame, AdminPlayer, GamePlayer } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin', 'coach'] })

const playerId = useRoute().params.id as string
type PlayerGame = { game: AdminGame, record: GamePlayer }
type PlayerDetail = { player: AdminPlayer, games: PlayerGame[] }

const savingGameId = ref<string | null>(null)
const actionError = ref<string | null>(null)
const actionSuccess = ref<string | null>(null)
const { data, pending, error, refresh } = await useFetch<PlayerDetail>(`/api/coach/players/${playerId}`)
const games = computed(() => data.value?.games ?? [])
const totals = computed(() => games.value.reduce((sum, item) => ({
  appearances: sum.appearances + (item.record.participated ? 1 : 0),
  minutes: sum.minutes + item.record.minutes_played,
  goals: sum.goals + item.record.goals,
  assists: sum.assists + item.record.assists,
  yellowCards: sum.yellowCards + item.record.yellow_cards,
  redCards: sum.redCards + item.record.red_cards,
}), { appearances: 0, minutes: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }))

function formatDate(value: string) { return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) }
function formatGameDate(value: string) { return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function availabilityStatus(status: GamePlayer['availability_status']) { return status === 'available' ? 'confirmed' : status === 'unavailable' ? 'declined' : 'pending' }
function selectionStatus(status: GamePlayer['selection_status']) { return status === 'started' ? 'confirmed' : status === 'substitute' ? 'neutral' : status === 'not_selected' ? 'declined' : 'pending' }
function availabilityLabel(status: GamePlayer['availability_status']) { return status === 'available' ? 'Parent: available' : status === 'unavailable' ? 'Parent: unavailable' : 'Parent: awaiting response' }
function selectionLabel(status: GamePlayer['selection_status']) { return status === 'started' ? 'Coach: started' : status === 'substitute' ? 'Coach: substitute' : status === 'not_selected' ? 'Coach: not selected' : 'Coach: selected' }
function updateCoachNote(record: GamePlayer, value: string | number | undefined) { record.coach_note = value ? String(value) : null }

async function saveStatistics(item: PlayerGame) {
  savingGameId.value = item.game.id
  actionError.value = null
  actionSuccess.value = null
  try {
    await $fetch(`/api/coach/games/${item.game.id}/players/${playerId}`, {
      method: 'PATCH',
      body: {
        selection_status: item.record.selection_status,
        participated: item.record.participated,
        minutes_played: item.record.minutes_played,
        goals: item.record.goals,
        assists: item.record.assists,
        yellow_cards: item.record.yellow_cards,
        red_cards: item.record.red_cards,
        coach_note: item.record.coach_note,
      },
    })
    await refresh()
    actionSuccess.value = `Statistics saved for ${item.game.team.name} vs ${item.game.opponent_name}.`
  }
  catch (value) {
    actionError.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to save player statistics.'
  }
  finally {
    savingGameId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <NuxtLink to="/coach/players" class="text-sm text-brand-700">← Players</NuxtLink>
    <div v-if="pending">Loading player...</div>
    <p v-else-if="error" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ error.statusMessage || 'Unable to load player.' }}</p>

    <template v-else-if="data">
      <div class="flex items-center gap-4"><div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserRound class="h-8 w-8" /></div><div><h1>{{ data.player.full_name }}{{ data.player.shirt_number ? ` · #${data.player.shirt_number}` : '' }}</h1><p class="text-body text-[color:var(--color-text-secondary)]">{{ data.player.teams.map((team) => `${team.name} · ${team.age_group.name}`).join(', ') }}</p></div></div>
      <Card class="grid gap-4 sm:grid-cols-3"><div><p class="text-label text-[color:var(--color-text-secondary)]">Date of birth</p><p>{{ formatDate(data.player.date_of_birth) }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Shirt number</p><p>{{ data.player.shirt_number ? `#${data.player.shirt_number}` : 'Not set' }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Status</p><Badge :status="data.player.is_active ? 'confirmed' : 'neutral'">{{ data.player.is_active ? 'Active' : 'Inactive' }}</Badge></div></Card>

      <section class="space-y-3"><div><h2>Player statistics</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Totals from all games in this player’s squad history.</p></div><div class="grid grid-cols-2 gap-3 sm:grid-cols-7"><Card v-for="item in [{ label: 'Games', value: games.length }, { label: 'Played', value: totals.appearances }, { label: 'Minutes', value: totals.minutes }, { label: 'Goals', value: totals.goals }, { label: 'Assists', value: totals.assists }, { label: 'Yellow', value: totals.yellowCards }, { label: 'Red', value: totals.redCards } ]" :key="item.label" class="p-3"><p class="text-label text-[color:var(--color-text-secondary)]">{{ item.label }}</p><p class="mt-1 text-h2">{{ item.value }}</p></Card></div></section>

      <p v-if="actionError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ actionError }}</p>
      <p v-if="actionSuccess" class="rounded-lg border border-[color:var(--status-confirmed-ring)] bg-[var(--status-confirmed-bg)] p-4 text-sm text-[var(--status-confirmed-text)]">{{ actionSuccess }}</p>

      <Card class="overflow-hidden p-0"><div class="border-b border-border p-4"><h2>Games and statistics</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Review upcoming selections and edit match statistics for every game.</p></div><p v-if="!games.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">This player has not been added to a game squad yet.</p><article v-for="item in games" :key="item.game.id" class="space-y-4 border-b border-border p-4 last:border-b-0"><div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><NuxtLink :to="`/coach/games/${item.game.id}`" class="font-medium hover:text-brand-700">{{ item.game.team.name }} vs {{ item.game.opponent_name }}</NuxtLink><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ formatGameDate(item.game.scheduled_at) }} · {{ item.game.location_type }} · {{ item.game.status }}</p></div><div class="flex flex-wrap gap-2"><Badge :status="availabilityStatus(item.record.availability_status)">{{ availabilityLabel(item.record.availability_status) }}</Badge><Badge :status="selectionStatus(item.record.selection_status)">{{ selectionLabel(item.record.selection_status) }}</Badge></div></div><p v-if="item.record.availability_note" class="text-sm text-[color:var(--color-text-secondary)]">Parent note: {{ item.record.availability_note }}</p><div class="grid gap-3 sm:grid-cols-3"><label class="text-sm">Selection<select v-model="item.record.selection_status" class="mt-1 min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm"><option value="selected">Selected</option><option value="started">Started</option><option value="substitute">Substitute</option><option value="not_selected">Not selected</option></select></label><label class="flex min-h-11 items-end gap-2 pb-2 text-sm"><input v-model="item.record.participated" type="checkbox" class="h-4 w-4 rounded border-input text-brand-700 focus:ring-brand-400"> Played</label><label class="text-sm">Minutes<Input v-model.number="item.record.minutes_played" class="mt-1" type="number" min="0" max="180" /></label><label class="text-sm">Goals<Input v-model.number="item.record.goals" class="mt-1" type="number" min="0" max="30" /></label><label class="text-sm">Assists<Input v-model.number="item.record.assists" class="mt-1" type="number" min="0" max="30" /></label><label class="text-sm">Yellow cards<Input v-model.number="item.record.yellow_cards" class="mt-1" type="number" min="0" max="2" /></label><label class="text-sm">Red cards<Input v-model.number="item.record.red_cards" class="mt-1" type="number" min="0" max="1" /></label><label class="text-sm sm:col-span-2">Coach note<Input :model-value="item.record.coach_note ?? ''" class="mt-1" maxlength="500" placeholder="Optional match note" @update:model-value="updateCoachNote(item.record, $event)" /></label></div><Button variant="outline" size="sm" class="gap-2" :disabled="savingGameId !== null" @click="saveStatistics(item)"><Save class="h-4 w-4" aria-hidden="true" />{{ savingGameId === item.game.id ? 'Saving...' : 'Save statistics' }}</Button></article></Card>
    </template>
  </div>
</template>
