<script setup lang="ts">
import { computed, ref } from 'vue'
import { CheckCheck, CircleUserRound, MessageCircle, ShieldCheck, Trash2, X } from 'lucide-vue-next'
import type { AdminGame, GamePlayer } from '@@/types/admin-club'
import type { MatchWeatherResult } from '@@/types/weather'
import { usePolishLocale } from '@@/composables/usePolishLocale'

definePageMeta({ allowedRoles: ['admin', 'coach'] })

const gameId = useRoute().params.id as string
const selectedIds = ref<string[]>([])
const adding = ref(false)
const removingPlayerId = ref<string | null>(null)
const savingResult = ref(false)
const actionError = ref<string | null>(null)
const { availabilityLabel, gameStatusLabel, locationLabel, selectionLabel } = usePolishLocale()

const { data: gameData, pending: gamePending, error: gameError, refresh: refreshGame } = await useFetch<{ game: AdminGame, weather: MatchWeatherResult, weatherAttribution: { label: string, url: string } }>(`/api/coach/games/${gameId}`)
const { data: rosterData, pending: rosterPending, error: rosterError, refresh } = await useFetch<{ players: GamePlayer[] }>(`/api/coach/games/${gameId}/players`, { default: () => ({ players: [] }) })
const { data: eligibleData, error: eligibleError } = await useFetch<{ players: Array<{ id: string, full_name: string }> }>(`/api/coach/games/${gameId}/eligible-players`, { default: () => ({ players: [] }) })

const roster = computed(() => rosterData.value?.players ?? [])
const selectedPlayerIds = computed(() => new Set(roster.value.map((player) => player.player_id)))
const availablePlayers = computed(() => (eligibleData.value?.players ?? []).filter((player) => !selectedPlayerIds.value.has(player.id)))
const allAvailablePlayersSelected = computed(() => availablePlayers.value.length > 0 && availablePlayers.value.every((player) => selectedIds.value.includes(player.id)))
const attendanceCounts = computed(() => roster.value.reduce((counts, player) => {
  counts[player.availability_status] += 1
  return counts
}, { pending: 0, available: 0, unavailable: 0 }))
const confirmedPlayers = computed(() => roster.value.filter((player) => player.availability_status === 'available' && player.selection_status !== 'not_selected'))
const pendingPlayers = computed(() => roster.value.filter((player) => player.availability_status === 'pending' && player.selection_status !== 'not_selected'))
const whatsAppShareUrl = computed(() => {
  const game = gameData.value?.game
  if (!game) return null

  const weather = gameData.value?.weather
  const weatherSummary = !weather || weather.status !== 'available' ? null : [
    '🌤️ *Pogoda*',
    `${weather.temperatureMin}–${weather.temperatureMax}°C · ${weather.precipitationProbability}% szans na opady`,
    `Przewidywane opady: ${weather.precipitationMm} mm`,
  ].join('\n')

  const venue = [game.venue?.name, game.venue?.address, game.venue?.city].filter(Boolean).join(', ') || 'Miejsce do potwierdzenia'
  const confirmedList = confirmedPlayers.value.length
    ? confirmedPlayers.value.map((player) => `- ${player.player.full_name}`).join('\n')
    : 'Żaden zawodnik nie potwierdził jeszcze dostępności.'
  const pendingList = pendingPlayers.value.length
    ? pendingPlayers.value.map((player) => `- ${player.player.full_name}`).join('\n')
    : 'Wszyscy odpowiedzieli.'
  const message = [
    `⚽ *${game.team.name} – ${game.opponent_name}*`,
    '',
    '📅 *Data i godzina*',
    format(game.scheduled_at),
    '',
    '📍 *Miejsce*',
    venue,
    ...(weatherSummary ? ['', weatherSummary] : []),
    '',
    '✅ *Dostępni zawodnicy*',
    confirmedList,
    '',
    '⏳ *Oczekiwanie na potwierdzenie rodzica*',
    pendingList,
  ].join('\n')

  return `https://wa.me/?text=${encodeURIComponent(message)}`
})

function format(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function attendanceStatus(status: GamePlayer['availability_status']) {
  return status === 'available' ? 'confirmed' : status === 'unavailable' ? 'declined' : 'pending'
}

function selectionStatus(status: GamePlayer['selection_status']) {
  return status === 'started' ? 'confirmed' : status === 'substitute' ? 'neutral' : status === 'not_selected' ? 'declined' : 'pending'
}

function attendanceTooltip(status: GamePlayer['availability_status']) {
  return `Odpowiedź rodzica: ${availabilityLabel(status).toLowerCase()}.`
}

function selectionTooltip(status: GamePlayer['selection_status']) {
  return `Wybór trenera: ${selectionLabel(status).toLowerCase()}.`
}

function toggleAllAvailablePlayers() {
  selectedIds.value = allAvailablePlayersSelected.value
    ? []
    : availablePlayers.value.map((player) => player.id)
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
    actionError.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Nie udało się dodać zawodników.'
  }
  finally {
    adding.value = false
  }
}

async function removePlayer(player: GamePlayer) {
  if (!window.confirm(`Usunąć zawodnika ${player.player.full_name} z kadry tego meczu? Jego odpowiedź dotycząca dostępności i statystyki meczowe zostaną usunięte.`)) return

  actionError.value = null
  removingPlayerId.value = player.player_id
  try {
    await $fetch(`/api/coach/games/${gameId}/players/${player.player_id}`, { method: 'DELETE' })
    await refresh()
  }
  catch (value) {
    actionError.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Nie udało się usunąć zawodnika z meczu.'
  }
  finally {
    removingPlayerId.value = null
  }
}

async function saveResult() {
  const game = gameData.value?.game
  if (!game) return

  actionError.value = null
  savingResult.value = true
  try {
    await $fetch(`/api/coach/games/${gameId}`, { method: 'PATCH', body: { home_score: game.home_score, away_score: game.away_score, status: 'completed' } })
    await refreshGame()
  }
  catch (value) {
    actionError.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Nie udało się zapisać wyniku meczu.'
  }
  finally {
    savingResult.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <NuxtLink to="/coach/games" class="text-sm text-brand-700">← Wszystkie mecze</NuxtLink>

    <div v-if="gamePending" class="text-sm text-[color:var(--color-text-secondary)]">Wczytywanie meczu...</div>
    <p v-else-if="gameError || !gameData" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ gameError?.statusMessage || 'Nie udało się wczytać tego meczu. Sprawdź, czy masz dostęp do jego drużyny.' }}</p>

    <template v-else>
      <div class="space-y-2"><p class="eyebrow text-brand-700">Mecz</p><h1>{{ gameData.game.team.name }} – {{ gameData.game.opponent_name }}</h1><p class="text-body text-[color:var(--color-text-secondary)]">{{ format(gameData.game.scheduled_at) }} · {{ locationLabel(gameData.game.location_type) }}</p></div>

      <Card class="grid gap-4 sm:grid-cols-2"><div><p class="text-label text-[color:var(--color-text-secondary)]">Rozgrywki</p><p>{{ gameData.game.competition?.name || gameData.game.season.name }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Miejsce</p><p>{{ gameData.game.venue?.name || 'Do potwierdzenia' }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Status meczu</p><Badge :status="gameData.game.status === 'completed' ? 'confirmed' : gameData.game.status === 'cancelled' ? 'declined' : 'pending'">{{ gameStatusLabel(gameData.game.status) }}</Badge></div><div v-if="gameData.game.status === 'completed'"><p class="text-label text-[color:var(--color-text-secondary)]">Wynik</p><p>{{ gameData.game.home_score }}–{{ gameData.game.away_score }}</p></div><div v-if="gameData.game.notes" class="sm:col-span-2"><p class="text-label text-[color:var(--color-text-secondary)]">Notatki</p><p>{{ gameData.game.notes }}</p></div></Card>

      <AppMatchWeatherCard v-if="gameData.weather.status === 'available'" :weather="gameData.weather" :attribution="gameData.weatherAttribution" />
      <Card v-else-if="gameData.weather.status === 'forecast-not-available-yet'" class="text-sm text-[color:var(--color-text-secondary)]">Prognoza pogody nie jest jeszcze dostępna.</Card>

      <Card class="space-y-4"><div><h2>Wynik meczu</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Mecz rozpoczyna się od 0–0. Zapisanie wyniku kończy mecz.</p></div><form class="flex flex-wrap items-end gap-3" @submit.prevent="saveResult"><div><Label for="coach-home-score">Gospodarze</Label><Input id="coach-home-score" v-model.number="gameData.game.home_score" type="number" min="0" required /></div><span class="pb-2 text-h2">–</span><div><Label for="coach-away-score">Goście</Label><Input id="coach-away-score" v-model.number="gameData.game.away_score" type="number" min="0" required /></div><Button type="submit" :disabled="savingResult">{{ savingResult ? 'Zapisywanie...' : 'Zapisz wynik' }}</Button></form></Card>

      <p v-if="actionError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ actionError }}</p>
      <p v-if="rosterError || eligibleError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ rosterError?.statusMessage || eligibleError?.statusMessage || 'Nie udało się wczytać kadry meczowej.' }}</p>

      <template v-else>
        <Card class="space-y-4"><div><h2>Dodaj zawodników</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Dodaj aktywnych zawodników z {{ gameData.game.team.name }}, aby poprosić rodzica o odpowiedź.</p></div><div v-if="availablePlayers.length" class="space-y-3"><Button v-if="allAvailablePlayersSelected" type="button" variant="outline" class="w-full gap-2 border-[var(--status-declined-ring)] text-[var(--status-declined-text)] hover:bg-[var(--status-declined-bg)] sm:w-auto" :disabled="adding" @click="toggleAllAvailablePlayers"><X class="h-4 w-4" aria-hidden="true" />Odznacz wszystkich</Button><Button v-else type="button" class="w-full gap-2 sm:w-auto" :disabled="adding" @click="toggleAllAvailablePlayers"><CheckCheck class="h-4 w-4" aria-hidden="true" />Zaznacz wszystkich</Button><div class="grid gap-2 sm:grid-cols-2"><label v-for="player in availablePlayers" :key="player.id" class="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3"><input v-model="selectedIds" type="checkbox" :value="player.id"><span>{{ player.full_name }}</span></label></div></div><p v-else class="text-sm text-[color:var(--color-text-secondary)]">Wszyscy aktywni zawodnicy drużyny są już w kadrze tego meczu.</p><Button :disabled="adding || !selectedIds.length" @click="addPlayers">{{ adding ? 'Dodawanie zawodników...' : 'Dodaj wybranych zawodników' }}</Button></Card>

        <div class="grid grid-cols-3 gap-3"><Card><p class="text-label text-[color:var(--color-text-secondary)]">Dostępni</p><p class="mt-1 text-h2 text-[var(--status-confirmed-text)]">{{ attendanceCounts.available }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Niedostępni</p><p class="mt-1 text-h2 text-[var(--status-declined-text)]">{{ attendanceCounts.unavailable }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Oczekujący</p><p class="mt-1 text-h2 text-[var(--status-pending-text)]">{{ attendanceCounts.pending }}</p></Card></div>

        <Card class="overflow-hidden p-0"><div class="border-b border-border p-4"><h2>Kadra meczowa</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Dostępność rodzica i wybór trenera są pokazane osobno. Najedź na odznakę, aby poznać szczegóły.</p></div><p v-if="rosterPending" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Wczytywanie kadry...</p><p v-else-if="!roster.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Nie dodano jeszcze zawodników do tego meczu.</p><div v-for="player in roster" :key="player.player_id" class="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-medium">{{ player.player.full_name }}</p><p v-if="player.availability_note" class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Notatka rodzica: {{ player.availability_note }}</p></div><div class="flex flex-wrap items-center gap-2"><Badge :status="attendanceStatus(player.availability_status)" class="gap-1.5" :title="attendanceTooltip(player.availability_status)"><CircleUserRound class="h-3.5 w-3.5" aria-hidden="true" /><span>Rodzic: {{ availabilityLabel(player.availability_status) }}</span></Badge><Badge :status="selectionStatus(player.selection_status)" class="gap-1.5" :title="selectionTooltip(player.selection_status)"><ShieldCheck class="h-3.5 w-3.5" aria-hidden="true" /><span>Trener: {{ selectionLabel(player.selection_status) }}</span></Badge><Button variant="ghost" size="icon" class="text-[var(--status-declined-text)] hover:bg-[var(--status-declined-bg)]" :disabled="removingPlayerId !== null" :title="`Usuń ${player.player.full_name} z kadry meczowej`" :aria-label="`Usuń ${player.player.full_name} z kadry meczowej`" @click="removePlayer(player)"><Trash2 class="h-4 w-4" aria-hidden="true" /><span class="sr-only">Usuń zawodnika</span></Button></div></div></Card>
        <a v-if="whatsAppShareUrl" :href="whatsAppShareUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-medium text-white hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"><MessageCircle class="h-4 w-4" aria-hidden="true" />Udostępnij na grupie WhatsApp</a>
      </template>
    </template>
  </div>
</template>
