<script setup lang="ts">
import { computed, ref } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/vue3'
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-vue-next'
import type { CalendarOptions, DayCellContentArg, EventClickArg, EventMountArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { AdminGame } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin', 'coach', 'parent'] })

const router = useRouter()
const today = new Date()
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref(toDateKey(today))

function toDateKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

const range = computed(() => {
  const start = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1)
  const end = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
  return { startsAt: start.toISOString(), endsBefore: end.toISOString() }
})

const { data, pending, error, refresh } = await useFetch<{ games: AdminGame[] }>('/api/coach/calendar', {
  query: computed(() => ({ starts_at: range.value.startsAt, ends_before: range.value.endsBefore })),
  default: () => ({ games: [] }),
})

const games = computed(() => data.value?.games ?? [])
const selectedDayGames = computed(() => games.value.filter((game) => toDateKey(game.scheduled_at) === selectedDate.value))
const monthLabel = computed(() => new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(currentMonth.value))

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  initialDate: currentMonth.value,
  headerToolbar: false,
  fixedWeekCount: false,
  dayMaxEvents: false,
  height: 'auto',
  firstDay: 1,
  eventDisplay: 'block',
  events: games.value.map((game) => ({ id: game.id, title: `${game.team.name} vs ${game.opponent_name}`, start: game.scheduled_at, classNames: [`game-event--${game.status}`] })),
  eventClick: handleEventClick,
  eventDidMount: addGameTooltip,
  dateClick: handleDateClick,
  dayCellClassNames: (info: DayCellContentArg) => toDateKey(info.date) === selectedDate.value ? ['coach-calendar__selected-day'] : [],
}))

function previousMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

function goToToday() {
  currentMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
  selectedDate.value = toDateKey(today)
}

function handleEventClick(info: EventClickArg) {
  void router.push(`/coach/calendar/${info.event.id}`)
}

function handleDateClick(info: DateClickArg) {
  selectedDate.value = info.dateStr
}

function addGameTooltip(info: EventMountArg) {
  const game = games.value.find((item) => item.id === info.event.id)
  if (!game) return

  info.el.title = [
    `${game.team.name} vs ${game.opponent_name}`,
    formatTime(game.scheduled_at),
    game.venue?.name || 'Venue to be confirmed',
    game.status,
  ].join(' · ')
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatSelectedDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00`))
}

</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5">
    <div class="space-y-2">
      <p class="eyebrow text-brand-700">Coach area</p>
      <h1>Game calendar</h1>
      <p class="text-body text-[color:var(--color-text-secondary)]">All club games are shown here. Select a game to review the squad and record availability.</p>
    </div>

    <p v-if="error" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">
      {{ error.statusMessage || 'Unable to load the calendar.' }}
    </p>

    <Card class="overflow-hidden p-0">
      <div class="flex items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
        <Button variant="outline" size="icon" aria-label="Previous month" @click="previousMonth"><ChevronLeft class="h-5 w-5" /></Button>
        <div class="text-center"><h2 class="text-base">{{ monthLabel }}</h2><Button variant="ghost" size="sm" class="mt-0.5 text-brand-700" @click="goToToday">Today</Button></div>
        <Button variant="outline" size="icon" aria-label="Next month" @click="nextMonth"><ChevronRight class="h-5 w-5" /></Button>
      </div>
      <div v-if="pending" class="p-8 text-center text-sm text-[color:var(--color-text-secondary)]">Loading games...</div>
      <ClientOnly v-else>
        <FullCalendar :key="`${range.startsAt}-${selectedDate}`" class="coach-calendar" :options="calendarOptions" />
      </ClientOnly>
    </Card>

    <Card class="space-y-4">
      <div class="flex items-start gap-3"><CalendarDays class="mt-0.5 h-5 w-5 text-brand-700" /><div><h2>{{ formatSelectedDate(selectedDate) }}</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ selectedDayGames.length ? `${selectedDayGames.length} game${selectedDayGames.length === 1 ? '' : 's'} scheduled` : 'No games scheduled' }}</p></div></div>
      <p v-if="!selectedDayGames.length" class="rounded-lg bg-[var(--color-surface-sunken)] p-4 text-sm text-[color:var(--color-text-secondary)]">Choose another date from the calendar to see its games.</p>
      <NuxtLink v-for="game in selectedDayGames" :key="game.id" :to="`/coach/calendar/${game.id}`" class="flex min-h-11 items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
        <p class="w-12 shrink-0 text-sm font-medium text-brand-700">{{ formatTime(game.scheduled_at) }}</p>
        <div class="min-w-0 flex-1"><p class="truncate font-medium">{{ game.team.name }} vs {{ game.opponent_name }}</p><p class="mt-0.5 flex items-center gap-1 truncate text-sm text-[color:var(--color-text-secondary)]"><MapPin class="h-3.5 w-3.5 shrink-0" />{{ game.venue?.name || 'Venue to be confirmed' }}</p></div>
        <Badge :status="game.status === 'completed' ? 'confirmed' : game.status === 'cancelled' ? 'declined' : 'pending'">{{ game.status }}</Badge>
      </NuxtLink>
    </Card>
  </div>
</template>

<style scoped>
:deep(.coach-calendar .fc) { --fc-border-color: var(--color-border); --fc-page-bg-color: var(--color-surface); --fc-neutral-bg-color: var(--color-surface-sunken); --fc-today-bg-color: #e6f1fb; font-size: 0.8125rem; }
:deep(.coach-calendar .fc-scrollgrid) { border-width: 0; }
:deep(.coach-calendar .fc-col-header-cell) { padding: 0.625rem 0.25rem; color: var(--color-text-secondary); font-weight: 500; }
:deep(.coach-calendar .fc-daygrid-day-number) { padding: 0.5rem; color: var(--color-text-primary); }
:deep(.coach-calendar .fc-daygrid-day-frame) { min-height: 6rem; }
:deep(.coach-calendar .coach-calendar__selected-day .fc-daygrid-day-frame) { background: color-mix(in srgb, var(--color-brand-700) 12%, transparent); box-shadow: inset 0 0 0 2px var(--color-brand-700); }
:deep(.coach-calendar .coach-calendar__selected-day .fc-daygrid-day-number) { font-weight: 500; color: var(--color-brand-800); }
:deep(.coach-calendar .fc-daygrid-event) { margin: 0.125rem 0.25rem; border: 0; border-radius: 0.375rem; padding: 0.25rem 0.375rem; white-space: normal; overflow-wrap: anywhere; font-size: 0.75rem; font-weight: 500; line-height: 1.2; cursor: pointer; }
:deep(.coach-calendar .fc-daygrid-event .fc-event-main) { white-space: normal; }
:deep(.coach-calendar .fc-daygrid-event:focus-visible) { outline: 2px solid var(--color-brand-400); outline-offset: 1px; }
:deep(.coach-calendar .game-event--scheduled), :deep(.coach-calendar .game-event--postponed) { background: var(--status-pending-bg); color: var(--status-pending-text); }
:deep(.coach-calendar .game-event--completed) { background: var(--status-confirmed-bg); color: var(--status-confirmed-text); }
:deep(.coach-calendar .game-event--cancelled) { background: var(--status-declined-bg); color: var(--status-declined-text); text-decoration: line-through; }
@media (max-width: 640px) { :deep(.coach-calendar .fc-col-header-cell-cushion) { font-size: 0; } :deep(.coach-calendar .fc-col-header-cell-cushion::first-letter) { font-size: 0.75rem; } :deep(.coach-calendar .fc-daygrid-day-frame) { min-height: 4.75rem; } :deep(.coach-calendar .fc-daygrid-event) { margin-inline: 0.125rem; padding: 0.1875rem 0.25rem; font-size: 0.625rem; line-height: 1.15; } }
</style>
