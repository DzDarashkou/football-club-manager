<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import FullCalendar from '@fullcalendar/vue3'
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell, MapPin } from 'lucide-vue-next'
import type { CalendarOptions, DayCellContentArg, DayCellMountArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import type { AdminGame, AdminTrainingSession } from '@@/types/admin-club'
import { usePolishLocale } from '@@/composables/usePolishLocale'

definePageMeta({ allowedRoles: ['admin', 'coach', 'parent'] })

const { month, time, dayDate, gameStatusLabel } = usePolishLocale()
const today = new Date()
const currentMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref(toDateKey(today))
const gamesSection = ref<HTMLElement | null>(null)

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

const { data, pending, error } = await useFetch<{ games: AdminGame[], trainings: AdminTrainingSession[] }>('/api/coach/calendar', {
  query: computed(() => ({ starts_at: range.value.startsAt, ends_before: range.value.endsBefore })),
  default: () => ({ games: [], trainings: [] }),
})

const games = computed(() => data.value?.games ?? [])
const trainings = computed(() => data.value?.trainings ?? [])
const selectedDayGames = computed(() => games.value.filter((game) => toDateKey(game.scheduled_at) === selectedDate.value))
const selectedDayTrainings = computed(() => trainings.value.filter((training) => toDateKey(training.scheduled_at) === selectedDate.value))
const selectedEvents = computed(() => [
  ...selectedDayGames.value.map(game => ({ ...game, eventType: 'game' as const })),
  ...selectedDayTrainings.value.map(training => ({ ...training, eventType: 'training' as const })),
].sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)))
const monthLabel = computed(() => month(currentMonth.value))

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  initialDate: currentMonth.value,
  headerToolbar: false,
  fixedWeekCount: false,
  dayMaxEvents: false,
  height: 'auto',
  firstDay: 1,
  // Match summaries live below the calendar, so days stay the same height regardless of match count.
  events: [],
  dateClick: handleDateClick,
  dayCellClassNames: (info: DayCellContentArg) => toDateKey(info.date) === selectedDate.value ? ['coach-calendar__selected-day'] : [],
  dayCellDidMount: addEventIndicators,
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

function handleDateClick(info: DateClickArg) {
  selectedDate.value = info.dateStr
}

function addEventIndicators(info: DayCellMountArg) {
  const date = toDateKey(info.date)
  const eventContainer = info.el.querySelector<HTMLElement>('.fc-daygrid-day-events')
  if (!eventContainer) return
  const add = (count: number, type: 'game' | 'training') => {
    if (!count) return
    const label = type === 'game' ? (count === 1 ? 'mecz' : 'mecze') : (count === 1 ? 'trening' : 'treningi')
    const indicator = document.createElement('button'); indicator.type = 'button'; indicator.className = `coach-calendar__event-indicator coach-calendar__event-indicator--${type}`
    indicator.innerHTML = `<span aria-hidden="true">${type === 'game' ? '⚽' : '🏋'}</span><span>${count}</span>`
    indicator.title = `Pokaż ${count} ${label} z tego dnia`; indicator.setAttribute('aria-label', `${count} ${label}. Pokaż listę wydarzeń z tego dnia.`)
    indicator.addEventListener('click', event => { event.stopPropagation(); void selectDateAndShowGames(date) }); eventContainer.append(indicator)
  }
  add(games.value.filter(game => toDateKey(game.scheduled_at) === date).length, 'game')
  add(trainings.value.filter(training => toDateKey(training.scheduled_at) === date).length, 'training')
}

async function selectDateAndShowGames(date: string) {
  selectedDate.value = date
  await nextTick()
  gamesSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function formatTime(value: string) {
  return time(value)
}

function formatSelectedDate(value: string) {
  return dayDate(`${value}T12:00:00`)
}

</script>

<template>
  <div class="mx-auto max-w-6xl space-y-5">
    <div class="space-y-2">
      <p class="eyebrow text-brand-700">Strefa trenera</p>
      <h1>Kalendarz meczów</h1>
      <p class="text-body text-[color:var(--color-text-secondary)]">Wszystkie mecze klubu są widoczne tutaj. Wybierz mecz, aby sprawdzić kadrę i zapisać dostępność.</p>
    </div>

    <p v-if="error" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">
      {{ error.statusMessage || 'Nie udało się wczytać kalendarza.' }}
    </p>

    <Card class="overflow-hidden p-0">
      <div class="flex items-center justify-between gap-2 border-b border-border p-3 sm:p-4">
        <Button variant="outline" size="icon" aria-label="Poprzedni miesiąc" @click="previousMonth"><ChevronLeft class="h-5 w-5" /></Button>
        <div class="text-center"><h2 class="text-base">{{ monthLabel }}</h2><Button variant="ghost" size="sm" class="mt-0.5 text-brand-700" @click="goToToday">Dzisiaj</Button></div>
        <Button variant="outline" size="icon" aria-label="Następny miesiąc" @click="nextMonth"><ChevronRight class="h-5 w-5" /></Button>
      </div>
      <div v-if="pending" class="p-8 text-center text-sm text-[color:var(--color-text-secondary)]">Wczytywanie meczów...</div>
      <ClientOnly v-else>
        <FullCalendar :key="`${range.startsAt}-${selectedDate}`" class="coach-calendar" :options="calendarOptions" />
      </ClientOnly>
    </Card>

    <div ref="gamesSection" class="scroll-mt-4">
      <Card class="space-y-4">
        <div class="flex items-start gap-3"><CalendarDays class="mt-0.5 h-5 w-5 text-brand-700" /><div><h2>{{ formatSelectedDate(selectedDate) }}</h2><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ selectedEvents.length ? `Zaplanowane wydarzenia: ${selectedEvents.length}` : 'Brak zaplanowanych wydarzeń' }}</p></div></div>
        <p v-if="!selectedEvents.length" class="rounded-lg bg-[var(--color-surface-sunken)] p-4 text-sm text-[color:var(--color-text-secondary)]">Wybierz inną datę w kalendarzu, aby zobaczyć wydarzenia.</p>
        <NuxtLink v-for="item in selectedEvents" :key="`${item.eventType}-${item.id}`" :to="item.eventType === 'game' ? `/coach/calendar/${item.id}` : `/coach/calendar/trainings/${item.id}`" class="flex min-h-11 flex-col gap-2 rounded-lg border border-border p-3 transition hover:bg-brand-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:flex-row sm:items-center sm:gap-3">
          <div class="flex items-center gap-3 sm:contents">
            <component :is="item.eventType === 'game' ? CalendarDays : Dumbbell" class="h-4 w-4 shrink-0 text-brand-700" /><p class="w-12 shrink-0 text-sm font-medium text-brand-700">{{ formatTime(item.scheduled_at) }}</p>
            <Badge v-if="item.eventType === 'game'" class="ml-auto sm:order-4 sm:ml-0" :status="item.status === 'completed' ? 'confirmed' : item.status === 'cancelled' ? 'declined' : 'pending'">{{ gameStatusLabel(item.status) }}</Badge><Badge v-else class="ml-auto sm:order-4 sm:ml-0" :status="item.status === 'scheduled' ? 'confirmed' : 'declined'">{{ item.status === 'scheduled' ? 'Trening' : 'Odwołany' }}</Badge>
          </div>
          <div class="min-w-0 sm:order-3 sm:flex-1"><p class="font-medium sm:truncate">{{ item.eventType === 'game' ? `${item.team.name} – ${item.opponent_name}` : `${item.team.name} · Trening` }}</p><p class="mt-0.5 flex items-center gap-1 truncate text-sm text-[color:var(--color-text-secondary)]"><MapPin class="h-3.5 w-3.5 shrink-0" />{{ item.venue?.name || 'Miejsce do potwierdzenia' }}</p></div>
        </NuxtLink>
      </Card>
    </div>
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
:deep(.coach-calendar .fc-daygrid-day-events) { display: flex; min-height: 2rem; justify-content: center; gap: 0.25rem; margin: 0.125rem 0.25rem; }
:deep(.coach-calendar .coach-calendar__event-indicator) { display: inline-flex; min-width: 2rem; min-height: 2rem; align-items: center; justify-content: center; gap: 0.1875rem; border: 0; border-radius: 9999px; padding: 0.25rem 0.375rem; color: white; font-size: 0.75rem; font-weight: 500; line-height: 1; cursor: pointer; box-shadow: 0 1px 2px rgb(4 44 83 / 20%); }
:deep(.coach-calendar .coach-calendar__event-indicator--game) { background: var(--color-brand-700); }:deep(.coach-calendar .coach-calendar__event-indicator--training) { background: #639922; }
:deep(.coach-calendar .coach-calendar__event-indicator:focus-visible) { outline: 2px solid var(--color-brand-400); outline-offset: 2px; }
@media (max-width: 640px) { :deep(.coach-calendar .fc-col-header-cell-cushion) { font-size: 0; } :deep(.coach-calendar .fc-col-header-cell-cushion::first-letter) { font-size: 0.75rem; } :deep(.coach-calendar .fc-daygrid-day-frame) { min-height: 4.75rem; } :deep(.coach-calendar .fc-daygrid-day-events) { margin-inline: 0.125rem; } }
</style>
