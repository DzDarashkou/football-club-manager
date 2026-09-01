<script setup lang="ts">
import { computed, ref } from 'vue'
import { CalendarClock, CalendarPlus, Check, ExternalLink, MapPin, X } from 'lucide-vue-next'
import type { AdminGame, AvailabilityStatus, GamePlayer } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin', 'coach', 'parent'] })

const gameId = useRoute().params.gameId as string
const { role } = useAppAuth()
const savingPlayerId = ref<string | null>(null)
const actionError = ref<string | null>(null)
const { data, pending, error, refresh } = await useFetch<{ game: AdminGame, players: GamePlayer[] }>(`/api/coach/calendar/${gameId}`)

const game = computed(() => data.value?.game)
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
    location: venueQuery.value || 'Venue to be confirmed',
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
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function attendanceLabel(status: AvailabilityStatus) {
  return status === 'available' ? 'Confirmed' : status === 'unavailable' ? 'Rejected' : 'Pending'
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
    actionError.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Unable to update attendance.'
  }
  finally {
    savingPlayerId.value = null
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <NuxtLink to="/coach/calendar" class="inline-flex min-h-11 items-center rounded-lg border border-input bg-surface px-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">← Back to calendar</NuxtLink>
    <p v-if="pending" class="text-sm text-[color:var(--color-text-secondary)]">Loading game...</p>
    <p v-else-if="error || !game" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ error?.statusMessage || 'Unable to load this game.' }}</p>

    <template v-else>
      <div class="space-y-2"><p class="eyebrow text-brand-700">Game day</p><h1>{{ game.team.name }} vs {{ game.opponent_name }}</h1><p class="flex items-center gap-2 text-body text-[color:var(--color-text-secondary)]"><CalendarClock class="h-4 w-4" />{{ formatDate(game.scheduled_at) }}</p></div>

      <Card class="grid gap-4 sm:grid-cols-2"><div><p class="text-label text-[color:var(--color-text-secondary)]">Location</p><p class="capitalize">{{ game.location_type }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Competition</p><p>{{ game.competition?.name || 'Friendly' }}</p></div><div v-if="game.matchday || game.round_label"><p class="text-label text-[color:var(--color-text-secondary)]">Round</p><p>{{ game.round_label || `Matchday ${game.matchday}` }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Status</p><Badge :status="game.status === 'completed' ? 'confirmed' : game.status === 'cancelled' ? 'declined' : 'pending'">{{ game.status }}</Badge></div><div v-if="game.status === 'completed'"><p class="text-label text-[color:var(--color-text-secondary)]">Score</p><p>{{ game.home_score }}–{{ game.away_score }}</p></div><div v-if="game.notes" class="sm:col-span-2"><p class="text-label text-[color:var(--color-text-secondary)]">Notes</p><p>{{ game.notes }}</p></div></Card>

      <Card class="space-y-3"><div class="flex items-start gap-3"><MapPin class="mt-0.5 h-5 w-5 shrink-0 text-brand-700" /><div class="min-w-0 flex-1"><p class="text-label text-[color:var(--color-text-secondary)]">Venue</p><p class="font-medium">{{ game.venue?.name || 'Venue to be confirmed' }}</p><p v-if="game.venue?.address || game.venue?.city" class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ [game.venue?.address, game.venue?.city].filter(Boolean).join(', ') }}</p></div></div><div class="flex flex-wrap gap-2"><a v-if="mapsUrl" :href="mapsUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"><ExternalLink class="h-4 w-4" />Open in Google Maps</a><a v-if="googleCalendarUrl" :href="googleCalendarUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"><CalendarPlus class="h-4 w-4" />Add to Google Calendar</a></div></Card>

      <p v-if="actionError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ actionError }}</p>
      <div class="grid grid-cols-3 gap-3"><Card><p class="text-label text-[color:var(--color-text-secondary)]">Confirmed</p><p class="mt-1 text-h2 text-[var(--status-confirmed-text)]">{{ counts.available }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Rejected</p><p class="mt-1 text-h2 text-[var(--status-declined-text)]">{{ counts.unavailable }}</p></Card><Card><p class="text-label text-[color:var(--color-text-secondary)]">Pending</p><p class="mt-1 text-h2 text-[var(--status-pending-text)]">{{ counts.pending }}</p></Card></div>

      <Card class="overflow-hidden p-0"><div class="border-b border-border p-4"><h2>{{ role === 'parent' ? 'Selected players' : 'Requested players' }}</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ role === 'parent' ? 'Confirm or decline availability for the selected players.' : 'Confirm or reject availability after speaking with a parent.' }}</p></div><p v-if="!players.length" class="p-6 text-center text-sm text-[color:var(--color-text-secondary)]">No players have been requested for this game yet.</p><div v-for="player in players" :key="player.player_id" class="flex flex-col gap-3 border-b border-border p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"><div><p class="font-medium">{{ player.player.full_name }}</p><Badge class="mt-1" :status="attendanceBadge(player.availability_status)">{{ attendanceLabel(player.availability_status) }}</Badge></div><div class="grid grid-cols-2 gap-2 sm:flex"><Button size="sm" class="min-h-11 gap-1.5" :disabled="savingPlayerId !== null || player.availability_status === 'available'" @click="setAttendance(player, 'available')"><Check class="h-4 w-4" />Confirm</Button><Button variant="outline" size="sm" class="min-h-11 gap-1.5 border-[var(--status-declined-ring)] text-[var(--status-declined-text)] hover:bg-[var(--status-declined-bg)]" :disabled="savingPlayerId !== null || player.availability_status === 'unavailable'" @click="setAttendance(player, 'unavailable')"><X class="h-4 w-4" />Reject</Button></div></div></Card>
    </template>
  </div>
</template>
