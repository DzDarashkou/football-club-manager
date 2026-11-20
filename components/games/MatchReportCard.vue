<script setup lang="ts">
import { computed } from 'vue'
import {
  eventDisplayName,
  groupLineupStarters,
  isGoalEvent,
} from '@@/lib/game-report'
import type { AdminGame, GameEvent, GamePlayer } from '@@/types/admin-club'
import { usePolishLocale } from '@@/composables/usePolishLocale'

const {
  game,
  players = [],
  events = [],
} = defineProps<{
  game: AdminGame
  players?: GamePlayer[]
  events?: GameEvent[]
}>()

const { locationLabel } = usePolishLocale()

const homeTeamName = computed(() =>
  game.location_type === 'away' ? game.opponent_name : game.team.name,
)
const awayTeamName = computed(() =>
  game.location_type === 'away' ? game.team.name : game.opponent_name,
)

const ourScore = computed(() =>
  game.location_type === 'away' ? game.away_score : game.home_score,
)
const opponentScore = computed(() =>
  game.location_type === 'away' ? game.home_score : game.away_score,
)
const isCleanSheet = computed(
  () => game.status === 'completed' && opponentScore.value === 0,
)

const hasPossession = computed(
  () =>
    game.home_possession !== null &&
    game.home_possession !== undefined &&
    game.away_possession !== null &&
    game.away_possession !== undefined,
)

const lineupGroups = computed(() => groupLineupStarters(players))

const firstHalfEvents = computed(() =>
  events.filter((event) => event.half === 1),
)
const secondHalfEvents = computed(() =>
  events.filter((event) => event.half === 2),
)

const hasReportData = computed(
  () =>
    hasPossession.value ||
    lineupGroups.value.length > 0 ||
    events.length > 0 ||
    Boolean(game.summary?.trim()),
)

const formattedDateTime = computed(() => {
  const date = new Date(game.scheduled_at)
  const datePart = new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return [datePart, timePart, game.venue?.name].filter(Boolean).join(' • ')
})

const goalCountLabel = computed(() => {
  const count = ourScore.value
  if (count === 1) return '1 GOL'
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} GOLE`
  }
  return `${count} GOLI`
})

const halftimeScoreLabel = computed(() => {
  if (
    game.halftime_home_score !== null &&
    game.halftime_home_score !== undefined &&
    game.halftime_away_score !== null &&
    game.halftime_away_score !== undefined
  ) {
    return `${game.halftime_home_score}–${game.halftime_away_score}`
  }
  const lastFirstHalfGoal = [...firstHalfEvents.value]
    .reverse()
    .find(
      (event) =>
        isGoalEvent(event.event_type) &&
        event.home_score_after !== null &&
        event.away_score_after !== null,
    )
  if (lastFirstHalfGoal) {
    return `${lastFirstHalfGoal.home_score_after}–${lastFirstHalfGoal.away_score_after}`
  }
  return null
})

function formatEventSubtext(event: GameEvent): string | null {
  const parts: string[] = []
  if (event.assist_player?.full_name) {
    parts.push(`asysta: ${event.assist_player.full_name}`)
  }
  if (event.event_note?.trim()) {
    parts.push(event.event_note.trim())
  }
  return parts.length ? parts.join(' • ') : null
}
</script>

<template>
  <Card
    v-if="hasReportData"
    class="overflow-hidden p-0"
  >
    <!-- Header -->
    <div class="bg-brand-800 px-4 py-5 text-white sm:px-6">
      <p
        v-if="game.competition?.name || game.season?.name"
        class="text-center text-[11px] font-medium uppercase tracking-[1.5px] text-brand-200"
      >
        {{ game.competition?.name || game.season.name }}
      </p>

      <div class="mt-3 grid grid-cols-3 items-center gap-2 text-center">
        <div class="space-y-1">
          <p class="text-sm font-medium leading-tight sm:text-base">
            {{ homeTeamName }}
          </p>
        </div>

        <div>
          <p class="text-2xl font-medium tracking-tight sm:text-3xl">
            {{ game.home_score }} : {{ game.away_score }}
          </p>
        </div>

        <div class="space-y-1">
          <p class="text-sm font-medium leading-tight sm:text-base">
            {{ awayTeamName }}
          </p>
        </div>
      </div>

      <p class="mt-3 text-center text-xs text-brand-100">
        {{ formattedDateTime }}
      </p>
    </div>

    <!-- Possession & Quick Highlights -->
    <div
      v-if="hasPossession || game.status === 'completed'"
      class="border-b border-border bg-brand-50/60 px-4 py-3 sm:px-6"
    >
      <div
        class="flex flex-wrap items-center justify-between gap-2 text-xs font-medium"
      >
        <div
          v-if="hasPossession"
          class="flex items-center gap-2 text-brand-900"
        >
          <span class="uppercase tracking-wider text-[color:var(--color-text-secondary)]">
            Posiadanie
          </span>
          <span class="text-brand-700">{{ game.home_possession }}%</span>
        </div>

        <div class="mx-auto flex items-center gap-2 text-[11px] uppercase tracking-wider text-brand-800">
          <span>{{ goalCountLabel }}</span>
          <span v-if="isCleanSheet">• CZYSTE KONTO</span>
        </div>

        <div
          v-if="hasPossession"
          class="text-brand-900"
        >
          {{ game.away_possession }}%
        </div>
      </div>

      <div
        v-if="hasPossession"
        class="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
        aria-hidden="true"
      >
        <div
          class="bg-brand-700"
          :style="{ width: `${game.home_possession}%` }"
        />
        <div
          class="bg-brand-200"
          :style="{ width: `${game.away_possession}%` }"
        />
      </div>
    </div>

    <div class="space-y-6 p-4 sm:p-6">
      <!-- Starting Lineup -->
      <section
        v-if="lineupGroups.length"
        class="space-y-3"
      >
        <h3 class="text-xs font-medium uppercase tracking-[1.2px] text-brand-700">
          Skład wyjściowy ({{ game.team.name }})
        </h3>
        <div class="grid gap-3 rounded-lg border border-border bg-gray-50/70 p-3.5 sm:grid-cols-2">
          <div
            v-for="group in lineupGroups"
            :key="group.line"
            class="space-y-1"
          >
            <p class="text-[11px] font-medium uppercase tracking-wider text-brand-700">
              {{ group.label }}
            </p>
            <p class="text-sm text-foreground">
              {{ group.players.map((item) => item.player.full_name).join(' • ') }}
            </p>
          </div>
        </div>
      </section>

      <!-- Match Timeline -->
      <section
        v-if="events.length"
        class="space-y-4"
      >
        <h3 class="text-xs font-medium uppercase tracking-[1.2px] text-brand-700">
          Przebieg / wynik meczu
        </h3>

        <div
          v-if="firstHalfEvents.length"
          class="space-y-2"
        >
          <p class="text-center text-[11px] font-medium uppercase tracking-[1.2px] text-[color:var(--color-text-secondary)]">
            1. połowa
          </p>
          <div class="divide-y divide-border rounded-lg border border-border">
            <div
              v-for="event in firstHalfEvents"
              :key="event.id"
              class="flex items-center justify-between gap-3 px-3.5 py-2.5"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-foreground">
                  {{ eventDisplayName(event, game.opponent_name) }}
                </p>
                <p
                  v-if="formatEventSubtext(event)"
                  class="truncate text-xs text-[color:var(--color-text-secondary)]"
                >
                  {{ formatEventSubtext(event) }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2.5 text-sm">
                <span class="text-xs text-[color:var(--color-text-secondary)]">
                  {{ event.minute }}'
                </span>
                <span
                  v-if="isGoalEvent(event.event_type)"
                  aria-label="Gol"
                  >⚽</span
                >
                <span
                  v-else-if="event.event_type === 'yellow_card'"
                  class="inline-block h-3.5 w-2.5 rounded-[2px] bg-amber-400"
                  aria-label="Żółta kartka"
                />
                <span
                  v-else
                  class="inline-block h-3.5 w-2.5 rounded-[2px] bg-red-600"
                  aria-label="Czerwona kartka"
                />
                <span
                  v-if="
                    event.home_score_after !== null &&
                    event.away_score_after !== null
                  "
                  class="min-w-[2.5rem] text-right font-medium text-foreground"
                >
                  {{ event.home_score_after }}–{{ event.away_score_after }}
                </span>
              </div>
            </div>
            <div
              v-if="halftimeScoreLabel"
              class="bg-gray-50 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-brand-700"
            >
              Przerwa • {{ halftimeScoreLabel }}
            </div>
          </div>
        </div>

        <div
          v-if="secondHalfEvents.length"
          class="space-y-2"
        >
          <p class="text-center text-[11px] font-medium uppercase tracking-[1.2px] text-[color:var(--color-text-secondary)]">
            2. połowa
          </p>
          <div class="divide-y divide-border rounded-lg border border-border">
            <div
              v-for="event in secondHalfEvents"
              :key="event.id"
              class="flex items-center justify-between gap-3 px-3.5 py-2.5"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-foreground">
                  {{ eventDisplayName(event, game.opponent_name) }}
                </p>
                <p
                  v-if="formatEventSubtext(event)"
                  class="truncate text-xs text-[color:var(--color-text-secondary)]"
                >
                  {{ formatEventSubtext(event) }}
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-2.5 text-sm">
                <span class="text-xs text-[color:var(--color-text-secondary)]">
                  {{ event.minute }}'
                </span>
                <span
                  v-if="isGoalEvent(event.event_type)"
                  aria-label="Gol"
                  >⚽</span
                >
                <span
                  v-else-if="event.event_type === 'yellow_card'"
                  class="inline-block h-3.5 w-2.5 rounded-[2px] bg-amber-400"
                  aria-label="Żółta kartka"
                />
                <span
                  v-else
                  class="inline-block h-3.5 w-2.5 rounded-[2px] bg-red-600"
                  aria-label="Czerwona kartka"
                />
                <span
                  v-if="
                    event.home_score_after !== null &&
                    event.away_score_after !== null
                  "
                  class="min-w-[2.5rem] text-right font-medium text-foreground"
                >
                  {{ event.home_score_after }}–{{ event.away_score_after }}
                </span>
              </div>
            </div>
            <div
              v-if="game.status === 'completed'"
              class="bg-gray-50 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wider text-brand-700"
            >
              Koniec meczu • {{ game.home_score }}–{{ game.away_score }}
            </div>
          </div>
        </div>
      </section>

      <!-- Summary -->
      <section
        v-if="game.summary?.trim()"
        class="space-y-2 rounded-lg border border-border bg-gray-50/70 p-3.5"
      >
        <p class="text-[11px] font-medium uppercase tracking-[1.2px] text-[color:var(--color-text-secondary)]">
          Podsumowanie
        </p>
        <p class="whitespace-pre-line text-sm leading-relaxed text-foreground">
          {{ game.summary }}
        </p>
      </section>
    </div>

    <!-- Footer -->
    <div class="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-gray-50 px-4 py-3 text-xs sm:px-6">
      <span class="font-medium uppercase tracking-wider text-brand-700">
        {{ locationLabel(game.location_type) }}
      </span>
      <span
        v-if="game.report_source?.trim()"
        class="text-[color:var(--color-text-secondary)]"
      >
        Źródło: {{ game.report_source }}
      </span>
      <span
        v-if="game.status === 'completed'"
        class="font-medium text-foreground"
      >
        Wynik końcowy: {{ game.home_score }}–{{ game.away_score }}
      </span>
    </div>
  </Card>
</template>
