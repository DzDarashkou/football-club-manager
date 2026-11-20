<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { FileText, Plus, Sparkles, Trash2, Upload } from 'lucide-vue-next'
import type { ParseMatchReportResult } from '@@/lib/game-report-parser'
import {
  LINEUP_LINE_LABELS,
  LINEUP_LINE_ORDER,
  computeRunningScores,
  generateMatchSummaryDraft,
  isGoalEvent,
} from '@@/lib/game-report'
import type {
  AdminGame,
  GameEvent,
  GameEventType,
  GamePlayer,
  LineupLine,
} from '@@/types/admin-club'

const {
  game,
  players = [],
  events = [],
} = defineProps<{
  game: AdminGame
  players?: GamePlayer[]
  events?: GameEvent[]
}>()

const emit = defineEmits<{ saved: [] }>()

type DraftEvent = {
  localId: string
  half: 1 | 2
  minute: number
  event_type: GameEventType
  is_our_team: boolean
  player_id: string | null
  player_name_override: string | null
  assist_player_id: string | null
  event_note: string | null
}

const isOpen = ref(false)
const showImporter = ref(false)
const importing = ref(false)
const importText = ref('')
const importFile = ref<File | null>(null)
const importError = ref<string | null>(null)
const importWarnings = ref<string[]>([])
const saving = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)

const trackPossession = ref(false)
const homePossession = ref(50)
const halftimeHome = ref<string | number>('')
const halftimeAway = ref<string | number>('')
const summary = ref('')
const reportSource = ref('')
const syncPlayerStats = ref(true)
const syncGameScore = ref(false)

const starterLines = reactive<Record<string, LineupLine | ''>>({})
const draftEvents = ref<DraftEvent[]>([])

const newEvent = reactive({
  half: 1 as 1 | 2,
  minute: 1,
  event_type: 'goal' as GameEventType,
  is_our_team: true,
  player_id: '',
  player_name_override: '',
  assist_player_id: '',
  event_note: '',
})

const selectClass =
  'flex min-h-[44px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'

const eventTypeLabels: Record<GameEventType, string> = {
  goal: 'Gol',
  penalty_goal: 'Rzut karny (gol)',
  own_goal: 'Gol samobójczy',
  yellow_card: 'Żółta kartka',
  red_card: 'Czerwona kartka',
}

const hasExistingReport = computed(
  () =>
    game.home_possession !== null ||
    events.length > 0 ||
    Boolean(game.summary?.trim()) ||
    players.some(
      (player) =>
        player.selection_status === 'started' && Boolean(player.lineup_line),
    ),
)

const sortedPlayers = computed(() =>
  [...players].sort((a, b) =>
    a.player.full_name.localeCompare(b.player.full_name, 'pl'),
  ),
)

const playerNameMap = computed(
  () =>
    new Map(
      players.map((player) => [player.player_id, player.player.full_name]),
    ),
)

const scoredPreview = computed(() =>
  computeRunningScores(draftEvents.value, game.location_type),
)

function hydrateFromProps() {
  saveError.value = null
  saveSuccess.value = false

  if (game.home_possession !== null && game.home_possession !== undefined) {
    trackPossession.value = true
    homePossession.value = game.home_possession
  } else {
    trackPossession.value = false
    homePossession.value = 50
  }

  halftimeHome.value = game.halftime_home_score ?? ''
  halftimeAway.value = game.halftime_away_score ?? ''
  summary.value = game.summary ?? ''
  reportSource.value = game.report_source ?? ''
  syncPlayerStats.value = true
  syncGameScore.value = false

  for (const key of Object.keys(starterLines)) delete starterLines[key]
  for (const player of players) {
    starterLines[player.player_id] =
      player.selection_status === 'started' && player.lineup_line
        ? player.lineup_line
        : ''
  }

  draftEvents.value = events.map((event, index) => ({
    localId: event.id || `evt-${index}`,
    half: event.half,
    minute: event.minute,
    event_type: event.event_type,
    is_our_team: event.is_our_team,
    player_id: event.player_id,
    player_name_override: event.player_name_override,
    assist_player_id: event.assist_player_id,
    event_note: event.event_note,
  }))
}

watch(isOpen, (open) => {
  if (open) hydrateFromProps()
})

function addEvent() {
  saveError.value = null
  const minute = Math.min(150, Math.max(1, Number(newEvent.minute) || 1))
  const isGoal = isGoalEvent(newEvent.event_type)
  draftEvents.value.push({
    localId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    half: newEvent.half,
    minute,
    event_type: newEvent.event_type,
    is_our_team: newEvent.is_our_team,
    player_id:
      newEvent.is_our_team && newEvent.player_id ? newEvent.player_id : null,
    player_name_override: newEvent.player_name_override.trim() || null,
    assist_player_id:
      newEvent.is_our_team && isGoal && newEvent.assist_player_id
        ? newEvent.assist_player_id
        : null,
    event_note: newEvent.event_note.trim() || null,
  })

  newEvent.player_id = ''
  newEvent.player_name_override = ''
  newEvent.assist_player_id = ''
  newEvent.event_note = ''
}

function removeEvent(localId: string) {
  draftEvents.value = draftEvents.value.filter(
    (item) => item.localId !== localId,
  )
}

function generateSummary() {
  const mappedEvents = scoredPreview.value.events.map((event) => ({
    event_type: event.event_type,
    is_our_team: event.is_our_team,
    player: event.player_id
      ? {
          id: event.player_id,
          full_name: playerNameMap.value.get(event.player_id) ?? '',
        }
      : null,
    player_name_override: event.player_name_override,
  }))

  const hasGoalEvents = mappedEvents.some((event) =>
    isGoalEvent(event.event_type),
  )
  summary.value = generateMatchSummaryDraft(
    game,
    mappedEvents,
    hasGoalEvents
      ? {
          homeScore: scoredPreview.value.homeScore,
          awayScore: scoredPreview.value.awayScore,
        }
      : undefined,
  )
}

function previewActorName(event: DraftEvent): string {
  if (event.player_id) {
    const name = playerNameMap.value.get(event.player_id)
    if (name) return name
  }
  if (event.player_name_override?.trim()) return event.player_name_override.trim()
  return event.is_our_team ? game.team.name : game.opponent_name
}

async function saveReport() {
  saving.value = true
  saveError.value = null
  saveSuccess.value = false

  try {
    const starters = Object.entries(starterLines)
      .filter((entry): entry is [string, LineupLine] => Boolean(entry[1]))
      .map(([player_id, lineup_line]) => ({ player_id, lineup_line }))

    const parsedHomePossession = trackPossession.value
      ? Math.min(100, Math.max(0, Math.round(Number(homePossession.value) || 0)))
      : null

    await $fetch(`/api/coach/games/${game.id}/report`, {
      method: 'PUT',
      body: {
        home_possession: parsedHomePossession,
        away_possession:
          parsedHomePossession !== null ? 100 - parsedHomePossession : null,
        halftime_home_score:
          halftimeHome.value === '' ? null : Number(halftimeHome.value),
        halftime_away_score:
          halftimeAway.value === '' ? null : Number(halftimeAway.value),
        summary: summary.value.trim() || null,
        report_source: reportSource.value.trim() || null,
        starters,
        events: scoredPreview.value.events.map((event, index) => ({
          half: event.half,
          minute: event.minute,
          event_type: event.event_type,
          is_our_team: event.is_our_team,
          player_id: event.player_id,
          player_name_override: event.player_name_override,
          assist_player_id: event.assist_player_id,
          event_note: event.event_note,
          sort_order: index,
        })),
        sync_player_stats: syncPlayerStats.value,
        sync_game_score: syncGameScore.value,
      },
    })

    saveSuccess.value = true
    isOpen.value = false
    emit('saved')
  } catch (error) {
    saveError.value =
      (error as { data?: { statusMessage?: string } }).data?.statusMessage ||
      'Nie udało się zapisać raportu meczowego.'
  } finally {
    saving.value = false
  }
}

function handleImportFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  importFile.value = input.files?.[0] ?? null
}

async function importFromSource() {
  importError.value = null
  importWarnings.value = []

  if (!importFile.value && !importText.value.trim()) {
    importError.value = 'Wybierz plik PDF/TXT lub wklej treść raportu.'
    return
  }

  importing.value = true
  try {
    let result: ParseMatchReportResult
    if (importFile.value) {
      const formData = new FormData()
      formData.append('file', importFile.value)
      result = await $fetch<ParseMatchReportResult>(
        `/api/coach/games/${game.id}/report-import`,
        {
          method: 'POST',
          body: formData,
        },
      )
    } else {
      result = await $fetch<ParseMatchReportResult>(
        `/api/coach/games/${game.id}/report-import`,
        {
          method: 'POST',
          body: { text: importText.value },
        },
      )
    }

    const { draft, warnings } = result
    if (draft.home_possession !== null) {
      trackPossession.value = true
      homePossession.value = draft.home_possession
    }
    if (draft.halftime_home_score !== null) {
      halftimeHome.value = draft.halftime_home_score
    }
    if (draft.halftime_away_score !== null) {
      halftimeAway.value = draft.halftime_away_score
    }
    if (draft.summary) {
      summary.value = draft.summary
    }
    if (draft.report_source) {
      reportSource.value = draft.report_source
    }

    if (draft.starters.length) {
      for (const key of Object.keys(starterLines)) starterLines[key] = ''
      for (const starter of draft.starters) {
        starterLines[starter.player_id] = starter.lineup_line
      }
    }

    if (draft.events.length) {
      draftEvents.value = draft.events.map((evt, index) => ({
        localId: `imp-${Date.now()}-${index}`,
        half: evt.half,
        minute: evt.minute,
        event_type: evt.event_type,
        is_our_team: evt.is_our_team,
        player_id: evt.player_id,
        player_name_override: evt.player_name_override,
        assist_player_id: evt.assist_player_id,
        event_note: evt.event_note,
      }))
    }

    importWarnings.value = warnings
    showImporter.value = false
  } catch (error) {
    importError.value =
      (error as { data?: { statusMessage?: string } }).data?.statusMessage ||
      'Nie udało się zaimportować raportu.'
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <Card class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2>Raport meczowy</h2>
        <p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">
          Skład wyjściowy, posiadanie piłki, przebieg bramek i podsumowanie.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        class="gap-2"
        @click="isOpen = !isOpen"
      >
        <FileText
          class="h-4 w-4"
          aria-hidden="true"
        />
        {{
          isOpen
            ? 'Zamknij edytor'
            : hasExistingReport
              ? 'Edytuj raport'
              : 'Dodaj raport'
        }}
      </Button>
    </div>

    <p
      v-if="saveSuccess && !isOpen"
      class="rounded-lg border border-[color:var(--status-confirmed-ring)] bg-[var(--status-confirmed-bg)] px-3 py-2 text-sm text-[var(--status-confirmed-text)]"
    >
      Raport meczowy został zapisany.
    </p>

    <form
      v-if="isOpen"
      class="space-y-6 border-t border-border pt-4"
      @submit.prevent="saveReport"
    >
      <!-- Import from PDF or Text -->
      <section class="space-y-3 rounded-lg border border-border bg-brand-50/40 p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-sm font-medium text-foreground">
              Importuj z PDF lub tekstu
            </p>
            <p class="text-xs text-[color:var(--color-text-secondary)]">
              Automatycznie uzupełnia skład, posiadanie, bramki i podsumowanie.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="gap-1.5"
            @click="showImporter = !showImporter"
          >
            <Upload
              class="h-4 w-4"
              aria-hidden="true"
            />
            {{ showImporter ? 'Ukryj import' : 'Importuj z PDF / tekstu' }}
          </Button>
        </div>

        <div
          v-if="showImporter"
          class="space-y-3 border-t border-border pt-3"
        >
          <div>
            <Label for="report-import-file">Plik PDF lub TXT (opcjonalnie)</Label>
            <input
              id="report-import-file"
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              class="mt-1 block w-full text-xs text-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-surface file:px-3 file:py-1.5 file:text-xs file:font-medium"
              @change="handleImportFileChange"
            />
          </div>

          <div>
            <Label for="report-import-text">Lub wklej treść raportu</Label>
            <textarea
              id="report-import-text"
              v-model="importText"
              rows="5"
              class="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              placeholder="Wklej opis meczu, skład (BRAMKA:, OBRONA:, OFENSYWA:) oraz minuty bramek..."
            />
          </div>

          <p
            v-if="importError"
            class="rounded-md bg-[var(--status-declined-bg)] px-3 py-2 text-xs text-[var(--status-declined-text)]"
          >
            {{ importError }}
          </p>

          <Button
            type="button"
            size="sm"
            :disabled="importing"
            @click="importFromSource"
          >
            {{ importing ? 'Przetwarzanie...' : 'Wczytaj do edytora' }}
          </Button>
        </div>

        <div
          v-if="importWarnings.length"
          class="rounded-md border border-[color:var(--status-pending-ring)] bg-[var(--status-pending-bg)] p-3 text-xs text-[var(--status-pending-text)]"
        >
          <p class="font-medium">Sprawdź dopasowanie zawodników:</p>
          <ul class="mt-1 list-disc space-y-0.5 pl-4">
            <li
              v-for="warning in importWarnings"
              :key="warning"
            >
              {{ warning }}
            </li>
          </ul>
        </div>
      </section>

      <!-- Possession & Halftime Score -->
      <section class="space-y-3">
        <h3 class="text-sm font-medium text-foreground">
          Statystyki i wynik do przerwy
        </h3>
        <label class="flex items-center gap-2 text-sm text-foreground">
          <input
            v-model="trackPossession"
            type="checkbox"
            class="h-4 w-4 rounded border-input accent-brand-700"
          />
          Uwzględnij posiadanie piłki (%)
        </label>

        <div
          v-if="trackPossession"
          class="space-y-2 rounded-lg border border-border bg-gray-50 p-3"
        >
          <div class="flex items-center justify-between text-xs font-medium">
            <span>Gospodarze: {{ homePossession }}%</span>
            <span>Goście: {{ 100 - homePossession }}%</span>
          </div>
          <input
            v-model.number="homePossession"
            type="range"
            min="0"
            max="100"
            class="w-full accent-brand-700"
          />
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div>
            <Label for="report-ht-home">Do przerwy (gospodarze)</Label>
            <Input
              id="report-ht-home"
              v-model="halftimeHome"
              type="number"
              min="0"
              placeholder="Auto"
            />
          </div>
          <div>
            <Label for="report-ht-away">Do przerwy (goście)</Label>
            <Input
              id="report-ht-away"
              v-model="halftimeAway"
              type="number"
              min="0"
              placeholder="Auto"
            />
          </div>
          <div>
            <Label for="report-source">Źródło raportu</Label>
            <Input
              id="report-source"
              v-model="reportSource"
              type="text"
              placeholder="np. szczegółowy przebieg przekazany w PDF"
            />
          </div>
        </div>
      </section>

      <!-- Starting Lineup -->
      <section class="space-y-3">
        <div>
          <h3 class="text-sm font-medium text-foreground">
            Skład wyjściowy ({{ game.team.name }})
          </h3>
          <p class="text-xs text-[color:var(--color-text-secondary)]">
            Przypisz formację zawodnikom z podstawowej jedenastki/siódemki.
          </p>
        </div>

        <p
          v-if="!sortedPlayers.length"
          class="rounded-lg border border-border bg-gray-50 p-3 text-sm text-[color:var(--color-text-secondary)]"
        >
          Dodaj najpierw zawodników do kadry meczowej, aby ustawić skład
          wyjściowy.
        </p>

        <div
          v-else
          class="grid gap-2 sm:grid-cols-2"
        >
          <div
            v-for="player in sortedPlayers"
            :key="player.player_id"
            class="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
          >
            <span class="truncate text-sm font-medium text-foreground">
              {{ player.player.full_name }}
            </span>
            <select
              v-model="starterLines[player.player_id]"
              :aria-label="`Formacja dla ${player.player.full_name}`"
              class="min-h-9 rounded-md border border-input bg-surface px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <option value="">Rezerwowy / brak</option>
              <option
                v-for="line in LINEUP_LINE_ORDER"
                :key="line"
                :value="line"
              >
                {{ LINEUP_LINE_LABELS[line] }}
              </option>
            </select>
          </div>
        </div>
      </section>

      <!-- Match Events Timeline -->
      <section class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-medium text-foreground">
            Przebieg meczu ({{ scoredPreview.events.length }})
          </h3>
          <span
            v-if="scoredPreview.events.length"
            class="text-xs font-medium text-brand-700"
          >
            Wynik ze zdarzeń: {{ scoredPreview.homeScore }}–{{
              scoredPreview.awayScore
            }}
          </span>
        </div>

        <div
          v-if="scoredPreview.events.length"
          class="divide-y divide-border rounded-lg border border-border"
        >
          <div
            v-for="event in scoredPreview.events"
            :key="event.localId"
            class="flex items-center justify-between gap-3 px-3 py-2 text-sm"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-foreground">
                {{ event.half }}. poł. • {{ event.minute }}' —
                {{ previewActorName(event) }}
                <span class="text-xs font-normal text-[color:var(--color-text-secondary)]">
                  ({{ eventTypeLabels[event.event_type] }})
                </span>
              </p>
              <p
                v-if="event.assist_player_id || event.event_note"
                class="truncate text-xs text-[color:var(--color-text-secondary)]"
              >
                {{
                  [
                    event.assist_player_id
                      ? `asysta: ${playerNameMap.get(event.assist_player_id) ?? ''}`
                      : null,
                    event.event_note,
                  ]
                    .filter(Boolean)
                    .join(' • ')
                }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <span
                v-if="
                  event.home_score_after !== null &&
                  event.away_score_after !== null
                "
                class="text-xs font-medium text-brand-700"
              >
                {{ event.home_score_after }}–{{ event.away_score_after }}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-[var(--status-declined-text)] hover:bg-[var(--status-declined-bg)]"
                aria-label="Usuń zdarzenie"
                @click="removeEvent(event.localId)"
              >
                <Trash2
                  class="h-4 w-4"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        </div>

        <!-- Add Event Form -->
        <div class="space-y-3 rounded-lg border border-border bg-gray-50 p-3">
          <p class="text-xs font-medium uppercase tracking-wider text-brand-700">
            Dodaj zdarzenie
          </p>
          <div class="grid gap-3 sm:grid-cols-4">
            <div>
              <Label for="evt-half">Połowa</Label>
              <select
                id="evt-half"
                v-model.number="newEvent.half"
                :class="selectClass"
              >
                <option :value="1">1. połowa</option>
                <option :value="2">2. połowa</option>
              </select>
            </div>
            <div>
              <Label for="evt-minute">Minuta</Label>
              <Input
                id="evt-minute"
                v-model.number="newEvent.minute"
                type="number"
                min="1"
                max="150"
              />
            </div>
            <div>
              <Label for="evt-type">Typ</Label>
              <select
                id="evt-type"
                v-model="newEvent.event_type"
                :class="selectClass"
              >
                <option
                  v-for="(label, value) in eventTypeLabels"
                  :key="value"
                  :value="value"
                >
                  {{ label }}
                </option>
              </select>
            </div>
            <div>
              <Label for="evt-team">Drużyna</Label>
              <select
                id="evt-team"
                v-model="newEvent.is_our_team"
                :class="selectClass"
              >
                <option :value="true">{{ game.team.name }}</option>
                <option :value="false">{{ game.opponent_name }}</option>
              </select>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div v-if="newEvent.is_our_team">
              <Label for="evt-player">Zawodnik</Label>
              <select
                id="evt-player"
                v-model="newEvent.player_id"
                :class="selectClass"
              >
                <option value="">Wybierz zawodnika...</option>
                <option
                  v-for="player in sortedPlayers"
                  :key="player.player_id"
                  :value="player.player_id"
                >
                  {{ player.player.full_name }}
                </option>
              </select>
            </div>
            <div v-if="!newEvent.is_our_team || !newEvent.player_id">
              <Label for="evt-player-name">
                {{
                  newEvent.is_our_team
                    ? 'Lub wpisz nazwisko'
                    : 'Zawodnik rywala (opcjonalnie)'
                }}
              </Label>
              <Input
                id="evt-player-name"
                v-model="newEvent.player_name_override"
                type="text"
                placeholder="np. Jan Kowalski"
              />
            </div>
            <div v-if="newEvent.is_our_team && isGoalEvent(newEvent.event_type)">
              <Label for="evt-assist">Asysta (opcjonalnie)</Label>
              <select
                id="evt-assist"
                v-model="newEvent.assist_player_id"
                :class="selectClass"
              >
                <option value="">Brak asysty</option>
                <option
                  v-for="player in sortedPlayers"
                  :key="player.player_id"
                  :value="player.player_id"
                >
                  {{ player.player.full_name }}
                </option>
              </select>
            </div>
            <div>
              <Label for="evt-note">Opis / kontekst (opcjonalnie)</Label>
              <Input
                id="evt-note"
                v-model="newEvent.event_note"
                type="text"
                placeholder="np. po rzucie rożnym"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            class="gap-1.5"
            @click="addEvent"
          >
            <Plus
              class="h-4 w-4"
              aria-hidden="true"
            />
            Dodaj do przebiegu
          </Button>
        </div>
      </section>

      <!-- Summary -->
      <section class="space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <Label for="report-summary">Podsumowanie meczu</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            class="gap-1.5 text-brand-700"
            @click="generateSummary"
          >
            <Sparkles
              class="h-4 w-4"
              aria-hidden="true"
            />
            Wygeneruj podsumowanie
          </Button>
        </div>
        <textarea
          id="report-summary"
          v-model="summary"
          rows="3"
          class="w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          placeholder="Krótki opis przebiegu meczu i wyróżniających się zawodników..."
        />
      </section>

      <!-- Sync Options -->
      <section class="space-y-2 rounded-lg border border-border bg-gray-50 p-3">
        <label class="flex items-center gap-2 text-sm text-foreground">
          <input
            v-model="syncPlayerStats"
            type="checkbox"
            class="h-4 w-4 rounded border-input accent-brand-700"
          />
          Aktualizuj gole, asysty i kartki zawodników na podstawie zdarzeń
        </label>
        <label
          v-if="scoredPreview.events.some((e) => isGoalEvent(e.event_type))"
          class="flex items-center gap-2 text-sm text-foreground"
        >
          <input
            v-model="syncGameScore"
            type="checkbox"
            class="h-4 w-4 rounded border-input accent-brand-700"
          />
          Zapisz wynik końcowy meczu ({{ scoredPreview.homeScore }}–{{
            scoredPreview.awayScore
          }}) i oznacz mecz jako zakończony
        </label>
      </section>

      <p
        v-if="saveError"
        class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-3 text-sm text-[var(--status-declined-text)]"
      >
        {{ saveError }}
      </p>

      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          @click="isOpen = false"
        >
          Anuluj
        </Button>
        <Button
          type="submit"
          :disabled="saving"
        >
          {{ saving ? 'Zapisywanie...' : 'Zapisz raport' }}
        </Button>
      </div>
    </form>
  </Card>
</template>
