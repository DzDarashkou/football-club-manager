<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarPlus, CircleUserRound, ExternalLink, MessageCircle, Trash2 } from 'lucide-vue-next'
import type { AdminGame, GamePlayer } from '@@/types/admin-club'
import type { MatchWeatherResult } from '@@/types/weather'
import { usePolishLocale } from '@@/composables/usePolishLocale'
import { useCoachGameRoster } from '@@/composables/useCoachGameRoster'

const { gameId, backTo = '/coach/games', backLabel = '← Wszystkie mecze' } = defineProps<{
  gameId: string
  backTo?: string
  backLabel?: string
}>()
const { role } = useAppAuth()
const canManageGame = computed(() => role.value === 'admin' || role.value === 'coach')
// Temporarily hide the squad section while retaining its UI and handlers.
const showSelectedPlayers = false
// Temporarily hide attendance totals without removing their markup or calculations.
const showAttendanceSummary = false
const removingPlayerId = ref<string | null>(null)
const savingResult = ref(false)
const actionError = ref<string | null>(null)
const { availabilityLabel, gameStatusLabel, locationLabel, gameName } = usePolishLocale()

const { data: gameData, pending: gamePending, error: gameError, refresh: refreshGame } = await useFetch<{ game: AdminGame, players?: GamePlayer[], weather: MatchWeatherResult, weatherAttribution: { label: string, url: string } }>(() => canManageGame.value ? `/api/coach/games/${gameId}` : `/api/coach/calendar/${gameId}`)
const { data: rosterData, pending: rosterPending, error: rosterError, refresh } = await useCoachGameRoster(gameId, canManageGame)

const roster = computed(() => canManageGame.value ? rosterData.value?.players ?? [] : gameData.value?.players ?? [])
const attendanceCounts = computed(() => roster.value.reduce((counts, player) => {
  counts[player.availability_status] += 1
  return counts
}, { pending: 0, available: 0, unavailable: 0 }))
const venueQuery = computed(() => [gameData.value?.game?.venue?.name, gameData.value?.game?.venue?.address, gameData.value?.game?.venue?.city].filter(Boolean).join(', '))
const mapsUrl = computed(() => venueQuery.value ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQuery.value)}` : null)
const googleCalendarUrl = computed(() => {
  const game = gameData.value?.game
  if (!game) return null

  const startsAt = new Date(game.scheduled_at)
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: gameName(game.team.name, game.opponent_name, game.location_type),
    dates: `${toGoogleCalendarDate(startsAt)}/${toGoogleCalendarDate(endsAt)}`,
    location: venueQuery.value || 'Miejsce do potwierdzenia',
    details: [
      game.competition?.name,
      game.notes,
    ].filter(Boolean).join('\n\n'),
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
})

function toGoogleCalendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

const whatsAppShareUrl = computed(() => {
  const game = gameData.value?.game
  if (!game) return null

  const weather = gameData.value?.weather
  const weatherSummary = !weather || weather.status !== 'available' ? null : [
    '🌤️ *Pogoda*',
    `${weather.temperatureMin}–${weather.temperatureMax}°C · ${weather.precipitationProbability}% szans na opady`,
    `Przewidywane opady: ${weather.precipitationMm} mm`,
  ].join('\n')

  const message = [
    `⚽ *${gameName(game.team.name, game.opponent_name, game.location_type)}*`,
    '',
    '📅 *Data i godzina*',
    format(game.scheduled_at),
    '',
    '📍 *Miejsce*',
    venueQuery.value || 'Miejsce do potwierdzenia',
    ...(mapsUrl.value ? [mapsUrl.value] : []),
    ...(weatherSummary ? ['', weatherSummary] : []),
  ].join('\n')

  return `https://wa.me/?text=${encodeURIComponent(message)}`
})

function format(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function attendanceStatus(status: GamePlayer['availability_status']) {
  return status === 'available' ? 'confirmed' : status === 'unavailable' ? 'declined' : 'pending'
}

function attendanceTooltip(status: GamePlayer['availability_status']) {
  return `Odpowiedź rodzica: ${availabilityLabel(status).toLowerCase()}.`
}

async function removePlayer(player: GamePlayer) {
  if (!canManageGame.value) return
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
  if (!game || !canManageGame.value) return

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
    <NuxtLink :to="backTo" class="inline-flex min-h-11 items-center text-sm text-brand-700">{{ backLabel }}</NuxtLink>

    <div v-if="gamePending" class="text-sm text-[color:var(--color-text-secondary)]">Wczytywanie meczu...</div>
    <p v-else-if="gameError || !gameData" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ gameError?.statusMessage || 'Nie udało się wczytać tego meczu. Sprawdź, czy masz dostęp do jego drużyny.' }}</p>

    <template v-else>
      <div class="space-y-2"><p class="eyebrow text-brand-700">Mecz</p><h1>{{ gameName(gameData.game.team.name, gameData.game.opponent_name, gameData.game.location_type) }}</h1><p class="text-body text-[color:var(--color-text-secondary)]">{{ format(gameData.game.scheduled_at) }} · {{ locationLabel(gameData.game.location_type) }}</p></div>

      <Card class="grid gap-4 sm:grid-cols-2"><div><p class="text-label text-[color:var(--color-text-secondary)]">Rozgrywki</p><p>{{ gameData.game.competition?.name || gameData.game.season.name }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Miejsce</p><p>{{ gameData.game.venue?.name || 'Do potwierdzenia' }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Status meczu</p><Badge :status="gameData.game.status === 'completed' ? 'confirmed' : gameData.game.status === 'cancelled' ? 'declined' : 'pending'">{{ gameStatusLabel(gameData.game.status) }}</Badge></div><div v-if="gameData.game.status === 'completed'"><p class="text-label text-[color:var(--color-text-secondary)]">Wynik</p><p>{{ gameData.game.home_score }}–{{ gameData.game.away_score }}</p></div><div v-if="gameData.game.notes" class="sm:col-span-2"><p class="text-label text-[color:var(--color-text-secondary)]">Notatki</p><p>{{ gameData.game.notes }}</p></div></Card>

      <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          <ExternalLink class="h-4 w-4 shrink-0" aria-hidden="true" />Otwórz w Mapach Google
        </a>
        <a v-if="googleCalendarUrl" :href="googleCalendarUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-input px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          <CalendarPlus class="h-4 w-4 shrink-0" aria-hidden="true" />Dodaj do Kalendarza Google
        </a>
      </div>

      <AppBroadcastLink :game="gameData.game" /><AppMatchWeatherCard v-if="gameData.weather.status === 'available'" :weather="gameData.weather" :attribution="gameData.weatherAttribution" />
      <Card v-else-if="gameData.weather.status === 'forecast-not-available-yet'" class="text-sm text-[color:var(--color-text-secondary)]">Prognoza pogody nie jest jeszcze dostępna.</Card>

      <Card v-if="canManageGame" class="space-y-4"><div><h2>Wynik meczu</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Mecz rozpoczyna się od 0–0. Zapisanie wyniku kończy mecz.</p></div><form class="flex flex-wrap items-end gap-3" @submit.prevent="saveResult"><div><Label for="coach-home-score">Gospodarze</Label><Input id="coach-home-score" v-model.number="gameData.game.home_score" type="number" min="0" required /></div><span class="pb-2 text-h2">–</span><div><Label for="coach-away-score">Goście</Label><Input id="coach-away-score" v-model.number="gameData.game.away_score" type="number" min="0" required /></div><Button type="submit" :disabled="savingResult">{{ savingResult ? 'Zapisywanie...' : 'Zapisz wynik' }}</Button></form></Card>

      <p v-if="actionError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ actionError }}</p>
      <p v-if="rosterError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ rosterError?.statusMessage || 'Nie udało się wczytać kadry meczowej.' }}</p>

      <template v-else>

        <div v-if="showAttendanceSummary" class="grid grid-cols-3 gap-3"><Card><p class="text-label text-[color:var(--color-text-secondary)]">Dostępni</p><p class="mt-1 text-h2 text-[var(--status-confirmed-text)]">{{ attendanceCounts.available }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Niedostępni</p><p class="mt-1 text-h2 text-[var(--status-declined-text)]">{{ attendanceCounts.unavailable }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Oczekujący</p><p class="mt-1 text-h2 text-[var(--status-pending-text)]">{{ attendanceCounts.pending }}</p></Card></div>

        <Card v-if="showSelectedPlayers" class="overflow-hidden p-0"><div class="border-b border-border p-4"><h2>Kadra meczowa</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Dostępność zawodników na podstawie odpowiedzi rodziców.</p></div><p v-if="rosterPending" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Wczytywanie kadry...</p><p v-else-if="!roster.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Nie dodano jeszcze zawodników do tego meczu.</p><div v-for="player in roster" :key="player.player_id" class="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-medium">{{ player.player.full_name }}</p><p v-if="player.availability_note" class="mt-1 text-sm text-[color:var(--color-text-secondary)]">Notatka rodzica: {{ player.availability_note }}</p></div><div class="flex flex-wrap items-center gap-2"><Badge :status="attendanceStatus(player.availability_status)" class="gap-1.5" :title="attendanceTooltip(player.availability_status)"><CircleUserRound class="h-3.5 w-3.5" aria-hidden="true" /><span>Rodzic: {{ availabilityLabel(player.availability_status) }}</span></Badge><Button v-if="canManageGame" variant="ghost" size="icon" class="text-[var(--status-declined-text)] hover:bg-[var(--status-declined-bg)]" :disabled="removingPlayerId !== null" :title="`Usuń ${player.player.full_name} z kadry meczowej`" :aria-label="`Usuń ${player.player.full_name} z kadry meczowej`" @click="removePlayer(player)"><Trash2 class="h-4 w-4" aria-hidden="true" /><span class="sr-only">Usuń zawodnika</span></Button></div></div></Card>
        <a v-if="whatsAppShareUrl" :href="whatsAppShareUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#25D366] px-3 text-sm font-medium text-white hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"><MessageCircle class="h-4 w-4" aria-hidden="true" />Udostępnij na grupie WhatsApp</a>
      </template>
    </template>
  </div>
</template>
