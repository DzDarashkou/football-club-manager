<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ArrowLeft, ArrowRight, ChevronRight, FileText } from 'lucide-vue-next'
import MatchReportCard from '@@/components/games/MatchReportCard.vue'
import { usePolishLocale } from '@@/composables/usePolishLocale'
import type { AdminGame, GameEvent, GamePlayer } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin', 'coach', 'parent'] })

const route = useRoute()
const router = useRouter()
const { gameName, locationLabel } = usePolishLocale()

const selectedTeamId = ref('')
const selectedGameId = ref(
  typeof route.query.game === 'string' ? route.query.game : '',
)

watch(
  () => route.query.game,
  (gameQuery) => {
    selectedGameId.value = typeof gameQuery === 'string' ? gameQuery : ''
  },
)

const { data, pending, error } = await useFetch<{
  reports: Array<{
    game: AdminGame
    players: GamePlayer[]
    events: GameEvent[]
  }>
  teams: Array<{ id: string; name: string }>
}>('/api/game-reports', {
  default: () => ({ reports: [], teams: [] }),
})

const teams = computed(() => data.value?.teams ?? [])
const allReports = computed(() => data.value?.reports ?? [])

const teamFilteredReports = computed(() =>
  selectedTeamId.value
    ? allReports.value.filter(
        (item) => item.game.team_id === selectedTeamId.value,
      )
    : allReports.value,
)

const selectedReport = computed(
  () =>
    allReports.value.find((item) => item.game.id === selectedGameId.value) ??
    null,
)

const selectClass =
  'flex min-h-[44px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'

function openReport(gameId: string) {
  selectedGameId.value = gameId
  void router.replace({ query: { ...route.query, game: gameId } })
}

function closeReport() {
  selectedGameId.value = ''
  const nextQuery = { ...route.query }
  delete nextQuery.game
  void router.replace({ query: nextQuery })
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <div class="space-y-2">
      <p class="eyebrow text-brand-700">Strefa klubu</p>
      <h1>Raporty meczowe</h1>
      <p class="text-body text-[color:var(--color-text-secondary)]">
        Przebieg spotkań, składy wyjściowe, strzelcy i podsumowania meczów
        drużyn Sporting Wrocław.
      </p>
    </div>

    <p
      v-if="error"
      class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]"
    >
      {{ error.statusMessage || 'Nie udało się wczytać raportów meczowych.' }}
    </p>

    <Card
      v-if="pending"
      class="p-8 text-center text-sm text-[color:var(--color-text-secondary)]"
    >
      Wczytywanie raportów meczowych...
    </Card>

    <Card
      v-else-if="!allReports.length"
      class="space-y-2 p-8 text-center"
    >
      <FileText
        class="mx-auto h-8 w-8 text-brand-700"
        aria-hidden="true"
      />
      <p class="font-medium text-foreground">
        Brak opublikowanych raportów meczowych
      </p>
      <p class="text-sm text-[color:var(--color-text-secondary)]">
        Raporty pojawią się tutaj po uzupełnieniu przebiegu meczu przez trenera
        lub administratora.
      </p>
    </Card>

    <!-- Full Single Report View -->
    <template v-else-if="selectedReport">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="gap-1.5"
          @click="closeReport"
        >
          <ArrowLeft
            class="h-4 w-4"
            aria-hidden="true"
          />
          Wróć do listy raportów
        </Button>

        <NuxtLink
          :to="`/coach/calendar/${selectedReport.game.id}`"
          class="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
        >
          Szczegóły meczu
          <ArrowRight
            class="h-3.5 w-3.5"
            aria-hidden="true"
          />
        </NuxtLink>
      </div>

      <MatchReportCard
        :game="selectedReport.game"
        :players="selectedReport.players"
        :events="selectedReport.events"
      />
    </template>

    <!-- All Reports Short View List -->
    <template v-else>
      <Card v-if="teams.length > 1">
        <div class="max-w-sm">
          <Label for="reports-team-filter">Filtruj według drużyny</Label>
          <select
            id="reports-team-filter"
            v-model="selectedTeamId"
            :class="selectClass"
          >
            <option value="">Wszystkie drużyny ({{ allReports.length }})</option>
            <option
              v-for="team in teams"
              :key="team.id"
              :value="team.id"
            >
              {{ team.name }}
            </option>
          </select>
        </div>
      </Card>

      <div class="space-y-3">
        <button
          v-for="item in teamFilteredReports"
          :key="item.game.id"
          type="button"
          class="group block w-full rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition hover:border-brand-400 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          @click="openReport(item.game.id)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1 space-y-1">
              <p
                class="text-[11px] font-medium uppercase tracking-wider text-brand-700"
              >
                {{
                  item.game.competition?.name ||
                  item.game.season?.name ||
                  item.game.team.name
                }}
                · {{ formatShortDate(item.game.scheduled_at) }}
              </p>

              <p class="truncate text-base font-medium text-foreground">
                {{
                  gameName(
                    item.game.team.name,
                    item.game.opponent_name,
                    item.game.location_type,
                  )
                }}
              </p>

              <p
                v-if="item.game.venue?.name"
                class="truncate text-xs text-[color:var(--color-text-secondary)]"
              >
                {{ item.game.venue.name }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-3">
              <div
                class="rounded-lg bg-brand-800 px-3 py-1.5 text-center text-base font-medium text-white"
              >
                {{ item.game.home_score }} : {{ item.game.away_score }}
              </div>
              <ChevronRight
                class="h-5 w-5 text-[color:var(--color-text-secondary)] transition group-hover:translate-x-0.5 group-hover:text-brand-700"
                aria-hidden="true"
              />
            </div>
          </div>

          <p
            v-if="item.game.summary?.trim()"
            class="mt-3 line-clamp-2 text-xs leading-relaxed text-[color:var(--color-text-secondary)]"
          >
            {{ item.game.summary }}
          </p>

          <div
            class="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-2.5 text-[11px] text-[color:var(--color-text-secondary)]"
          >
            <span class="font-medium text-brand-700">
              {{ locationLabel(item.game.location_type) }}
            </span>

            <span
              v-if="
                item.game.halftime_home_score !== null &&
                item.game.halftime_home_score !== undefined &&
                item.game.halftime_away_score !== null &&
                item.game.halftime_away_score !== undefined
              "
            >
              • Do przerwy: {{ item.game.halftime_home_score }}–{{
                item.game.halftime_away_score
              }}
            </span>

            <span
              v-if="
                item.game.home_possession !== null &&
                item.game.home_possession !== undefined &&
                item.game.away_possession !== null &&
                item.game.away_possession !== undefined
              "
            >
              • Posiadanie: {{ item.game.home_possession }}% /
              {{ item.game.away_possession }}%
            </span>

            <span v-if="item.events.length">
              • Zdarzenia: {{ item.events.length }}
            </span>

            <span v-if="item.players.length">
              • Skład: {{ item.players.length }}
            </span>

            <span
              v-if="item.game.report_pdf_url?.trim()"
              class="rounded bg-brand-50 px-1.5 py-0.5 font-medium text-brand-700"
            >
              PDF
            </span>

            <span class="ml-auto font-medium text-brand-700 group-hover:underline">
              Zobacz raport →
            </span>
          </div>
        </button>
      </div>
    </template>
  </div>
</template>
