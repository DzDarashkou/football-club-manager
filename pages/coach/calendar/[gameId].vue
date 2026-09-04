<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarClock, CalendarPlus, Check, ExternalLink, MapPin, X } from 'lucide-vue-next'
import type { AdminGame, AvailabilityStatus, GamePlayer } from '@@/types/admin-club'
import type { MatchWeatherResult } from '@@/types/weather'
import { usePolishLocale } from '@@/composables/usePolishLocale'

definePageMeta({ allowedRoles: ['admin', 'coach', 'parent'] })

const gameId = useRoute().params.gameId as string
const { role } = useAppAuth()
const { availabilityLabel, gameStatusLabel, locationLabel } = usePolishLocale()
const savingPlayerId = ref<string | null>(null)
const actionError = ref<string | null>(null)
const { data, pending, error, refresh } = await useFetch<{ game: AdminGame, players: GamePlayer[], weather: MatchWeatherResult, weatherAttribution: { label: string, url: string } }>(`/api/coach/calendar/${gameId}`)

const game = computed(() => data.value?.game)
const weather = computed(() => data.value?.weather)
const players = computed(() => data.value?.players ?? [])
const counts = computed(() => players.value.reduce((result, player) => {
  result[player.availability_status] += 1
  return result
}, { pending: 0, available: 0, unavailable: 0 }))
const venueQuery = computed(() => [game.value?.venue?.name, game.value?.venue?.address, game.value?.venue?.city].filter(Boolean).join(', '))
const mapsUrl = computed(() => venueQuery.value ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQuery.value)}` : null)
const googleCalendarUrl = computed(() => {
  if (!game.value) return null

  const startsAt = new Date(game.value.scheduled_at)
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${game.value.team.name} vs ${game.value.opponent_name}`,
    dates: `${toGoogleCalendarDate(startsAt)}/${toGoogleCalendarDate(endsAt)}`,
    location: venueQuery.value || 'Miejsce do potwierdzenia',
    details: [
      game.value.competition?.name,
      game.value.notes,
    ].filter(Boolean).join('\n\n'),
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
})

function toGoogleCalendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function attendanceBadge(status: AvailabilityStatus) {
  return status === 'available' ? 'confirmed' : status === 'unavailable' ? 'declined' : 'pending'
}

async function setAttendance(player: GamePlayer, status: 'available' | 'unavailable') {
  actionError.value = null
  savingPlayerId.value = player.player_id
  try {
    await $fetch(`/api/coach/calendar/${gameId}/players/${player.player_id}/attendance`, { method: 'PATCH', body: { availability_status: status } })
    await refresh()
  }
  catch (value) {
    actionError.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Nie udało się zaktualizować dostępności.'
  }
  finally {
    savingPlayerId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <NuxtLink to="/coach/calendar" class="inline-flex min-h-11 items-center rounded-lg border border-input bg-surface px-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">← Wróć do kalendarza</NuxtLink>
    <p v-if="pending" class="text-sm text-[color:var(--color-text-secondary)]">Wczytywanie meczu...</p>
    <p v-else-if="error || !game" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ error?.statusMessage || 'Nie udało się wczytać tego meczu.' }}</p>

    <template v-else>
      <div class="space-y-2"><p class="eyebrow text-brand-700">Dzień meczu</p><h1>{{ game.team.name }} – {{ game.opponent_name }}</h1><p class="flex items-center gap-2 text-body text-[color:var(--color-text-secondary)]"><CalendarClock class="h-4 w-4" />{{ formatDate(game.scheduled_at) }}</p></div>

      <Card class="grid gap-4 sm:grid-cols-2"><div><p class="text-label text-[color:var(--color-text-secondary)]">Lokalizacja</p><p>{{ locationLabel(game.location_type) }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Rozgrywki</p><p>{{ game.competition?.name || 'Mecz towarzyski' }}</p></div><div v-if="game.matchday || game.round_label"><p class="text-label text-[color:var(--color-text-secondary)]">Kolejka</p><p>{{ game.round_label || `Kolejka ${game.matchday}` }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Status</p><Badge :status="game.status === 'completed' ? 'confirmed' : game.status === 'cancelled' ? 'declined' : 'pending'">{{ gameStatusLabel(game.status) }}</Badge></div><div v-if="game.status === 'completed'"><p class="text-label text-[color:var(--color-text-secondary)]">Wynik</p><p>{{ game.home_score }}–{{ game.away_score }}</p></div><div v-if="game.notes" class="sm:col-span-2"><p class="text-label text-[color:var(--color-text-secondary)]">Notatki</p><p>{{ game.notes }}</p></div></Card>

      <AppMatchWeatherCard v-if="weather?.status === 'available' && data" :weather="weather" :attribution="data.weatherAttribution" />
      <Card v-else-if="weather?.status === 'forecast-not-available-yet'" class="text-sm text-[color:var(--color-text-secondary)]">Prognoza pogody nie jest jeszcze dostępna.</Card>

      <Card class="space-y-3"><div class="flex items-start gap-3"><MapPin class="mt-0.5 h-5 w-5 shrink-0 text-brand-700" /><div class="min-w-0 flex-1"><p class="text-label text-[color:var(--color-text-secondary)]">Miejsce</p><p class="font-medium">{{ game.venue?.name || 'Miejsce do potwierdzenia' }}</p><p v-if="game.venue?.address || game.venue?.city" class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ [game.venue?.address, game.venue?.city].filter(Boolean).join(', ') }}</p></div></div><div class="flex flex-wrap gap-2"><a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"><ExternalLink class="h-4 w-4" />Otwórz w Mapach Google</a><a v-if="googleCalendarUrl" :href="googleCalendarUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"><CalendarPlus class="h-4 w-4" />Dodaj do Kalendarza Google</a></div></Card>

      <p v-if="actionError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ actionError }}</p>
      <div class="grid grid-cols-3 gap-3"><Card><p class="text-label text-[color:var(--color-text-secondary)]">Dostępni</p><p class="mt-1 text-h2 text-[var(--status-confirmed-text)]">{{ counts.available }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Niedostępni</p><p class="mt-1 text-h2 text-[var(--status-declined-text)]">{{ counts.unavailable }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Oczekujący</p><p class="mt-1 text-h2 text-[var(--status-pending-text)]">{{ counts.pending }}</p></Card></div>

      <Card class="overflow-hidden p-0"><div class="border-b border-border p-4"><h2>{{ role === 'parent' ? 'Wybrani zawodnicy' : 'Zgłoszeni zawodnicy' }}</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ role === 'parent' ? 'Potwierdź lub odrzuć dostępność wybranych zawodników.' : 'Potwierdź lub odrzuć dostępność po rozmowie z rodzicem.' }}</p></div><p v-if="!players.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">Nie zgłoszono jeszcze zawodników do tego meczu.</p><div v-for="player in players" :key="player.player_id" class="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-medium">{{ player.player.full_name }}</p><Badge class="mt-1" :status="attendanceBadge(player.availability_status)">{{ availabilityLabel(player.availability_status) }}</Badge></div><div class="grid grid-cols-2 gap-2 sm:flex"><Button size="sm" class="min-h-11 gap-1.5" :disabled="savingPlayerId !== null || player.availability_status === 'available'" @click="setAttendance(player, 'available')"><Check class="h-4 w-4" />Potwierdź</Button><Button variant="outline" size="sm" class="min-h-11 gap-1.5 border-[var(--status-declined-ring)] text-[var(--status-declined-text)] hover:bg-[var(--status-declined-bg)]" :disabled="savingPlayerId !== null || player.availability_status === 'unavailable'" @click="setAttendance(player, 'unavailable')"><X class="h-4 w-4" />Odrzuć</Button></div></div></Card>
    </template>
  </div>
</template>
