<script setup lang="ts">
import { computed, ref } from 'vue'
import { CircleUserRound, MessageCircle, ShieldCheck, Trash2 } from 'lucide-vue-next'
import type { AdminGame, GamePlayer } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin', 'coach'] })

const gameId = useRoute().params.id as string
const selectedIds = ref<string[]>([])
const adding = ref(false)
const removingPlayerId = ref<string | null>(null)
const actionError = ref<string | null>(null)

const { data: gameData, pending: gamePending, error: gameError } = await useFetch<{ game: AdminGame }>(`/api/coach/games/${gameId}`)
const { data: rosterData, pending: rosterPending, error: rosterError, refresh } = await useFetch<{ players: GamePlayer[] }>(`/api/coach/games/${gameId}/players`, { default: () => ({ players: [] }) })
const { data: eligibleData, error: eligibleError } = await useFetch<{ players: Array<{ id: string, full_name: string }> }>(`/api/coach/games/${gameId}/eligible-players`, { default: () => ({ players: [] }) })

const roster = computed(() => rosterData.value?.players ?? [])
const selectedPlayerIds = computed(() => new Set(roster.value.map((player) => player.player_id)))
const availablePlayers = computed(() => (eligibleData.value?.players ?? []).filter((player) => !selectedPlayerIds.value.has(player.id)))
const attendanceCounts = computed(() => roster.value.reduce((counts, player) => {
  counts[player.availability_status] += 1
  return counts
}, { pending: 0, available: 0, unavailable: 0 }))
const confirmedPlayers = computed(() => roster.value.filter((player) => player.availability_status === 'available' && player.selection_status !== 'not_selected'))
const pendingPlayers = computed(() => roster.value.filter((player) => player.availability_status === 'pending' && player.selection_status !== 'not_selected'))
const whatsAppShareUrl = computed(() => {
  const game = gameData.value?.game
  if (!game) return null

  const venue = [game.venue?.name, game.venue?.address, game.venue?.city].filter(Boolean).join(', ') || 'Venue to be confirmed'
  const confirmedList = confirmedPlayers.value.length
    ? confirmedPlayers.value.map((player) => `- ${player.player.full_name}`).join('\n')
    : 'No players have confirmed availability yet.'
  const pendingList = pendingPlayers.value.length
    ? pendingPlayers.value.map((player) => `- ${player.player.full_name}`).join('\n')
    : 'Everyone has responded.'
  const message = [
    `⚽ *${game.team.name} vs ${game.opponent_name}*`,
    '',
    '📅 *Date & time*',
    format(game.scheduled_at),
    '',
    '📍 *Place*',
    venue,
    '',
    '✅ *Confirmed players*',
    confirmedList,
    '',
    '⏳ *Awaiting parent confirmation*',
    pendingList,
  ].join('\n')

  return `https://wa.me/?text=${encodeURIComponent(message)}`
})

function format(value: string) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function attendanceStatus(status: GamePlayer['availability_status']) {
  return status === 'available' ? 'confirmed' : status === 'unavailable' ? 'declined' : 'pending'
}

function attendanceLabel(status: GamePlayer['availability_status']) {
  return status === 'available' ? 'Available' : status === 'unavailable' ? 'Unavailable' : 'Awaiting response'
}

function selectionStatus(status: GamePlayer['selection_status']) {
  return status === 'started' ? 'confirmed' : status === 'substitute' ? 'neutral' : status === 'not_selected' ? 'declined' : 'pending'
}

function selectionLabel(status: GamePlayer['selection_status']) {
  return status === 'started' ? 'Started' : status === 'substitute' ? 'Substitute' : status === 'not_selected' ? 'Not selected' : 'Selected'
}

function attendanceTooltip(status: GamePlayer['availability_status']) {
  return `Parent response: ${attendanceLabel(status).toLowerCase()}.`
}

function selectionTooltip(status: GamePlayer['selection_status']) {
  return `Coach selection: ${selectionLabel(status).toLowerCase()}.`
}

async function addPlayers() {
  actionError.value = null
  adding.value = true
  try {
    await $fetch(`/api/coach/games/${gameId}/players`, { method: 'POST', body: { player_ids: selectedIds.value } })
    selectedIds.value = []
    await refresh()
  }
  catch (value) {
    actionError.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to add players.'
  }
  finally {
    adding.value = false
  }
}

async function removePlayer(player: GamePlayer) {
  if (!window.confirm(`Remove ${player.player.full_name} from this game squad? Their attendance response and game statistics will be removed.`)) return

  actionError.value = null
  removingPlayerId.value = player.player_id
  try {
    await $fetch(`/api/coach/games/${gameId}/players/${player.player_id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (value) {
    actionError.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to remove player from the game.'
  }
  finally {
    removingPlayerId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <NuxtLink to="/coach/games" class="text-sm text-brand-700">← All games</NuxtLink>

    <div v-if="gamePending" class="text-sm text-[color:var(--color-text-secondary)]">Loading game...</div>
    <p v-else-if="gameError || !gameData" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ gameError?.statusMessage || 'Unable to load this game. Confirm that you have access to its team.' }}</p>

    <template v-else>
      <div class="space-y-2"><p class="eyebrow text-brand-700">Game</p><h1>{{ gameData.game.team.name }} vs {{ gameData.game.opponent_name }}</h1><p class="text-body text-[color:var(--color-text-secondary)]">{{ format(gameData.game.scheduled_at) }} · {{ gameData.game.location_type }}</p></div>

      <Card class="grid gap-4 sm:grid-cols-2"><div><p class="text-label text-[color:var(--color-text-secondary)]">Competition</p><p>{{ gameData.game.competition?.name || gameData.game.season.name }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Venue</p><p>{{ gameData.game.venue?.name || 'To be confirmed' }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Game status</p><Badge :status="gameData.game.status === 'completed' ? 'confirmed' : gameData.game.status === 'cancelled' ? 'declined' : 'pending'">{{ gameData.game.status }}</Badge></div><div v-if="gameData.game.status === 'completed'"><p class="text-label text-[color:var(--color-text-secondary)]">Score</p><p>{{ gameData.game.home_score }}–{{ gameData.game.away_score }}</p></div><div v-if="gameData.game.notes" class="sm:col-span-2"><p class="text-label text-[color:var(--color-text-secondary)]">Notes</p><p>{{ gameData.game.notes }}</p></div></Card>

      <a v-if="whatsAppShareUrl" :href="whatsAppShareUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-medium text-white hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"><MessageCircle class="h-4 w-4" aria-hidden="true" />Share to WhatsApp group</a>

      <p v-if="actionError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ actionError }}</p>
      <p v-if="rosterError || eligibleError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ rosterError?.statusMessage || eligibleError?.statusMessage || 'Unable to load the game squad.' }}</p>

      <template v-else>
        <Card class="space-y-4"><div><h2>Add players</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Add active players from {{ gameData.game.team.name }} to request a parent response.</p></div><div v-if="availablePlayers.length" class="grid gap-2 sm:grid-cols-2"><label v-for="player in availablePlayers" :key="player.id" class="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3"><input v-model="selectedIds" type="checkbox" :value="player.id"><span>{{ player.full_name }}</span></label></div><p v-else class="text-sm text-[color:var(--color-text-secondary)]">All active team players are already in this game squad.</p><Button :disabled="adding || !selectedIds.length" @click="addPlayers">{{ adding ? 'Adding players...' : 'Add selected players' }}</Button></Card>

        <div class="grid grid-cols-3 gap-3"><Card><p class="text-label text-[color:var(--color-text-secondary)]">Approved</p><p class="mt-1 text-h2 text-[var(--status-confirmed-text)]">{{ attendanceCounts.available }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Not approved</p><p class="mt-1 text-h2 text-[var(--status-declined-text)]">{{ attendanceCounts.unavailable }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Pending</p><p class="mt-1 text-h2 text-[var(--status-pending-text)]">{{ attendanceCounts.pending }}</p></Card></div>

        <Card class="overflow-hidden p-0"><div class="border-b border-border p-4"><h2>Game squad</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Parent availability and coach selection are shown separately. Hover over a badge for details.</p></div><p v-if="rosterPending" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Loading squad...</p><p v-else-if="!roster.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">No players have been added to this game yet.</p><div v-for="player in roster" :key="player.player_id" class="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-medium">{{ player.player.full_name }}</p><p v-if="player.availability_note" class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Parent note: {{ player.availability_note }}</p></div><div class="flex flex-wrap items-center gap-2"><Badge :status="attendanceStatus(player.availability_status)" class="gap-1.5" :title="attendanceTooltip(player.availability_status)"><CircleUserRound class="h-3.5 w-3.5" aria-hidden="true" /><span>Parent: {{ attendanceLabel(player.availability_status) }}</span></Badge><Badge :status="selectionStatus(player.selection_status)" class="gap-1.5" :title="selectionTooltip(player.selection_status)"><ShieldCheck class="h-3.5 w-3.5" aria-hidden="true" /><span>Coach: {{ selectionLabel(player.selection_status) }}</span></Badge><Button variant="ghost" size="icon" class="text-[var(--status-declined-text)] hover:bg-[var(--status-declined-bg)]" :disabled="removingPlayerId !== null" :title="`Remove ${player.player.full_name} from game squad`" :aria-label="`Remove ${player.player.full_name} from game squad`" @click="removePlayer(player)"><Trash2 class="h-4 w-4" aria-hidden="true" /><span class="sr-only">Remove player</span></Button></div></div></Card>
      </template>
    </template>
  </div>
</template>
