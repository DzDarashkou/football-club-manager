<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { CalendarPlus, MapPin, Plus, Search, Trash2, Trophy } from 'lucide-vue-next'
import type { AdminCompetitionInput, AdminGame, AdminGameInput, AdminGameSetupResponse, AdminGamesResponse, AdminSeasonInput } from '@@/types/admin-club'
import { usePolishLocale } from '@@/composables/usePolishLocale'

definePageMeta({ allowedRoles: ['admin'] })
const selectClass = 'flex min-h-[44px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
const error = ref<string | null>(null); const success = ref<string | null>(null); const saving = ref(false)
const deletingGameId = ref<string | null>(null)
const gameSearch = ref('')
const teamFilter = ref('all')
const seasonFilter = ref('all')
const statusFilter = ref<'all' | AdminGame['status']>('scheduled')
const isCreatePanelOpen = ref(false)
const createPanel = ref<HTMLElement | null>(null)
const season = reactive<AdminSeasonInput>({ name: '', starts_on: '', ends_on: '' })
const competition = reactive<AdminCompetitionInput>({ name: '', season_id: '', type: 'league' })
const venue = reactive({ name: '', address: '', city: '' })
type GameForm = Omit<AdminGameInput, 'matchday' | 'round_label' | 'home_score' | 'away_score' | 'notes'> & {
  matchday: string | number
  round_label: string
  home_score: string | number
  away_score: string | number
  notes: string
}
const game = reactive<GameForm>({ team_id: '', season_id: '', competition_id: null, venue_id: null, opponent_name: '', location_type: 'home', scheduled_at: '', matchday: '', round_label: '', status: 'scheduled', home_score: 0, away_score: 0, notes: '' })
const { data: setupData, refresh: refreshSetup } = await useFetch<AdminGameSetupResponse>('/api/admin/games/setup', { default: () => ({ seasons: [], competitions: [], venues: [], teams: [] }) })
const { data: gamesData, pending, refresh: refreshGames } = await useFetch<AdminGamesResponse>('/api/admin/games', { default: () => ({ games: [] }) })
const setup = computed(() => setupData.value ?? { seasons: [], competitions: [], venues: [], teams: [] })
const games = computed(() => gamesData.value?.games ?? [])
const activeSeasons = computed(() => setup.value.seasons.filter((item) => item.is_active))
const activeCompetitions = computed(() => setup.value.competitions.filter((item) => item.is_active && item.season_id === game.season_id))
const activeVenues = computed(() => setup.value.venues.filter((item) => item.is_active))
const activeTeams = computed(() => setup.value.teams.filter((item) => item.is_active))
const filteredGames = computed(() => {
  const query = gameSearch.value.trim().toLocaleLowerCase('pl-PL')
  return games.value.filter((item) => {
    const matchesQuery = !query || [item.team.name, item.opponent_name, item.season.name, item.competition?.name, item.venue?.name]
      .filter(Boolean).some(value => value!.toLocaleLowerCase('pl-PL').includes(query))
    return matchesQuery
      && (teamFilter.value === 'all' || item.team_id === teamFilter.value)
      && (seasonFilter.value === 'all' || item.season_id === seasonFilter.value)
      && (statusFilter.value === 'all' || item.status === statusFilter.value)
  })
})
const { competitionTypeLabel, gameStatusLabel, locationLabel } = usePolishLocale()
function message(value: string) { success.value = value; error.value = null }
function problem(value: unknown, fallback: string) { const details = value as { data?: { statusMessage?: string }, message?: string }; error.value = details.data?.statusMessage || details.message || fallback; success.value = null }
async function create(path: string, body: object, confirmation: string) { saving.value = true; try { await $fetch(path, { method: 'POST', body }); await refreshSetup(); message(confirmation) } catch (value) { problem(value, 'Nie udało się zapisać tego rekordu.') } finally { saving.value = false } }
async function createSeason() { await create('/api/admin/seasons', { ...season, name: season.name.trim() }, 'Sezon został utworzony.'); season.name = ''; season.starts_on = ''; season.ends_on = '' }
async function createCompetition() { await create('/api/admin/competitions', { ...competition, name: competition.name.trim() }, 'Rozgrywki zostały utworzone.'); competition.name = '' }
async function createVenue() { await create('/api/admin/venues', { ...venue, name: venue.name.trim(), address: venue.address.trim() || null, city: venue.city.trim() || null }, 'Miejsce zostało utworzone.'); venue.name = ''; venue.address = ''; venue.city = '' }
async function createGame() { saving.value = true; try { await $fetch('/api/admin/games', { method: 'POST', body: { ...game, opponent_name: game.opponent_name.trim(), scheduled_at: new Date(game.scheduled_at).toISOString(), matchday: game.matchday === '' ? null : game.matchday, round_label: game.round_label.trim() || null, notes: game.notes.trim() || null } }); await refreshGames(); message('Mecz został utworzony.'); isCreatePanelOpen.value = false; game.opponent_name = ''; game.scheduled_at = ''; game.matchday = ''; game.round_label = ''; game.home_score = 0; game.away_score = 0; game.notes = '' } catch (value) { problem(value, 'Nie udało się utworzyć meczu.') } finally { saving.value = false } }
async function deleteGame(item: AdminGame) {
  if (!window.confirm(`Usunąć mecz ${item.team.name} – ${item.opponent_name}? Kadra i zapisy obecności również zostaną usunięte.`)) return
  deletingGameId.value = item.id
  try { await $fetch(`/api/admin/games/${item.id}`, { method: 'DELETE' } as never); await refreshGames(); message('Mecz został usunięty.') }
  catch (value) { problem(value, 'Nie udało się usunąć meczu.') }
  finally { deletingGameId.value = null }
}
watch(activeSeasons, (items) => { if (!game.season_id && items[0]) game.season_id = items[0].id; if (!competition.season_id && items[0]) competition.season_id = items[0].id }, { immediate: true })
watch(activeTeams, (items) => { if (!game.team_id && items[0]) game.team_id = items[0].id }, { immediate: true })
watch(activeVenues, (items) => { if (!game.venue_id && items[0]) game.venue_id = items[0].id }, { immediate: true })
watch(() => game.season_id, () => { if (!activeCompetitions.value.some((item) => item.id === game.competition_id)) game.competition_id = null })
function formattedDate(value: string) { return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
async function openCreatePanel() { isCreatePanelOpen.value = true; await nextTick(); createPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="space-y-2"><p class="eyebrow text-brand-700">Strefa administratora</p><h1>Mecze</h1><p class="max-w-2xl text-body text-[color:var(--color-text-secondary)]">Planuj nadchodzące mecze, zapisuj wyniki i zarządzaj ich szczegółami.</p></div>
      <Button class="gap-2" @click="openCreatePanel"><Plus class="h-4 w-4" />Utwórz mecz</Button>
    </div>
    <div v-if="success" class="rounded-lg border border-[color:var(--status-confirmed-ring)] bg-[var(--status-confirmed-bg)] px-4 py-3 text-sm text-[var(--status-confirmed-text)]">{{ success }}</div>
    <div v-if="error" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] px-4 py-3 text-sm text-[var(--status-declined-text)]">{{ error }}</div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
      <div class="space-y-6">
        <Card class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="relative md:col-span-2"><Label for="game-search">Szukaj meczu</Label><Search class="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-[color:var(--color-text-secondary)]" /><Input id="game-search" v-model="gameSearch" class="pl-9" placeholder="Drużyna, przeciwnik lub miejsce" /></div>
          <div><Label for="game-team-filter">Drużyna</Label><select id="game-team-filter" v-model="teamFilter" :class="selectClass"><option value="all">Wszystkie drużyny</option><option v-for="item in activeTeams" :key="item.id" :value="item.id">{{ item.name }}</option></select></div>
          <div><Label for="game-season-filter">Sezon</Label><select id="game-season-filter" v-model="seasonFilter" :class="selectClass"><option value="all">Wszystkie sezony</option><option v-for="item in setup.seasons" :key="item.id" :value="item.id">{{ item.name }}</option></select></div>
          <div class="md:col-span-2 xl:col-span-4"><Label for="game-status-filter">Status</Label><select id="game-status-filter" v-model="statusFilter" :class="selectClass"><option value="scheduled">Nadchodzące</option><option value="all">Wszystkie statusy</option><option value="completed">Zakończone</option><option value="postponed">Przełożone</option><option value="cancelled">Odwołane</option></select></div>
        </Card>
        <Card class="overflow-hidden p-0"><div class="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4"><div><h2>Mecze</h2><p class="mt-1 text-label text-[color:var(--color-text-secondary)]">{{ statusFilter === 'scheduled' ? 'Nadchodzące mecze' : '100 ostatnich meczów' }}</p></div><Badge variant="secondary">{{ pending ? 'Odświeżanie' : `Mecze: ${filteredGames.length}` }}</Badge></div><div v-if="pending" class="px-4 py-8 text-center text-sm text-[color:var(--color-text-secondary)]">Wczytywanie meczów...</div><div v-else-if="!filteredGames.length" class="px-4 py-8 text-center text-sm text-[color:var(--color-text-secondary)]">Żaden mecz nie spełnia wybranych filtrów.</div><div v-for="item in filteredGames" :key="item.id" class="flex flex-col gap-4 border-b border-border px-4 py-4 last:border-b-0 sm:flex-row sm:items-center"><NuxtLink :to="`/admin/games/${item.id}`" class="min-w-0 flex-1 hover:text-brand-700"><div class="flex flex-wrap items-center justify-between gap-2"><p class="font-medium">{{ item.team.name }} – {{ item.opponent_name }}</p><Badge :status="item.status === 'completed' ? 'confirmed' : item.status === 'cancelled' ? 'declined' : 'pending'">{{ gameStatusLabel(item.status) }}</Badge></div><p class="mt-1 text-sm text-[color:var(--color-text-secondary)]">{{ formattedDate(item.scheduled_at) }} · {{ locationLabel(item.location_type) }}{{ item.matchday ? ` · Kolejka ${item.matchday}` : '' }}</p><p class="text-label text-[color:var(--color-text-secondary)]">{{ item.season.name }}{{ item.competition ? ` · ${item.competition.name}` : '' }}{{ item.venue ? ` · ${item.venue.name}` : '' }}{{ item.status === 'completed' ? ` · ${item.home_score}–${item.away_score}` : '' }}</p></NuxtLink><div class="flex shrink-0 gap-2"><NuxtLink :to="`/coach/games/${item.id}`" class="rounded-lg border border-input px-3 py-2 text-sm hover:bg-brand-50">Widok trenera</NuxtLink><Button variant="destructive" size="sm" class="gap-2" :disabled="deletingGameId === item.id" @click="deleteGame(item)"><Trash2 class="h-4 w-4" />{{ deletingGameId === item.id ? 'Usuwanie...' : 'Usuń' }}</Button></div></div></Card>
      </div>
      <aside ref="createPanel" class="space-y-4 xl:sticky xl:top-6 xl:h-fit">
        <Card v-if="isCreatePanelOpen" class="space-y-5"><div class="flex items-center gap-3"><CalendarPlus class="h-5 w-5 text-brand-700" /><div><h2>Utwórz mecz</h2><p class="text-label text-[color:var(--color-text-secondary)]">Rozgrywki i miejsce są opcjonalne dla meczów towarzyskich.</p></div></div><form class="grid gap-4 sm:grid-cols-2 xl:grid-cols-1" @submit.prevent="createGame"><div><Label for="game-team">Drużyna Sporting</Label><select id="game-team" v-model="game.team_id" :class="selectClass" required><option value="" disabled>Wybierz drużynę</option><option v-for="item in activeTeams" :key="item.id" :value="item.id">{{ item.name }}</option></select></div><div><Label for="game-season">Sezon</Label><select id="game-season" v-model="game.season_id" :class="selectClass" required><option value="" disabled>Wybierz sezon</option><option v-for="item in activeSeasons" :key="item.id" :value="item.id">{{ item.name }}</option></select></div><div><Label for="opponent">Przeciwnik</Label><Input id="opponent" v-model="game.opponent_name" placeholder="Nazwa przeciwnika" required /></div><div><Label for="kickoff">Rozpoczęcie</Label><Input id="kickoff" v-model="game.scheduled_at" type="datetime-local" required /></div><div><Label for="game-competition">Rozgrywki</Label><select id="game-competition" v-model="game.competition_id" :class="selectClass"><option :value="null">Mecz towarzyski / bez rozgrywek</option><option v-for="item in activeCompetitions" :key="item.id" :value="item.id">{{ item.name }} ({{ competitionTypeLabel(item.type) }})</option></select></div><div><Label for="game-venue">Miejsce</Label><select id="game-venue" v-model="game.venue_id" :class="selectClass"><option :value="null">Miejsce do potwierdzenia</option><option v-for="item in activeVenues" :key="item.id" :value="item.id">{{ item.name }}{{ item.city ? ` · ${item.city}` : '' }}</option></select></div><div><Label for="location">Lokalizacja</Label><select id="location" v-model="game.location_type" :class="selectClass"><option value="home">U siebie</option><option value="away">Na wyjeździe</option><option value="neutral">Teren neutralny</option></select></div><div><Label for="matchday">Kolejka</Label><Input id="matchday" v-model="game.matchday" type="number" min="1" placeholder="np. 1" /></div><div><Label for="round">Runda</Label><Input id="round" v-model="game.round_label" placeholder="np. ćwierćfinał" /></div><div><Label for="game-status">Status</Label><select id="game-status" v-model="game.status" :class="selectClass"><option value="scheduled">Zaplanowany</option><option value="completed">Zakończony</option><option value="postponed">Przełożony</option><option value="cancelled">Odwołany</option></select></div><template v-if="game.status === 'completed'"><div><Label for="home-score">Wynik gospodarzy</Label><Input id="home-score" v-model="game.home_score" type="number" min="0" required /></div><div><Label for="away-score">Wynik gości</Label><Input id="away-score" v-model="game.away_score" type="number" min="0" required /></div></template><div class="sm:col-span-2 xl:col-span-1"><Label for="game-notes">Notatki</Label><textarea id="game-notes" v-model="game.notes" class="min-h-[88px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" placeholder="Opcjonalne szczegóły meczu" /></div><div class="flex gap-3 sm:col-span-2 xl:col-span-1"><Button type="submit" class="gap-2" :disabled="saving || !activeTeams.length || !activeSeasons.length"><Trophy class="h-4 w-4" />{{ saving ? 'Zapisywanie...' : 'Utwórz mecz' }}</Button><Button type="button" variant="outline" @click="isCreatePanelOpen = false">Anuluj</Button></div></form></Card>
        <Card v-else class="text-sm text-[color:var(--color-text-secondary)]">Wybierz „Utwórz mecz”, aby dodać nowe spotkanie.</Card>
      </aside>
    </div>
    <details class="rounded-xl border border-border bg-surface"><summary class="cursor-pointer px-4 py-4 font-medium">Zarządzaj sezonami, rozgrywkami i miejscami</summary><div class="grid gap-4 border-t border-border p-4 lg:grid-cols-3"><Card class="space-y-4"><h2>Utwórz sezon</h2><form class="space-y-3" @submit.prevent="createSeason"><div><Label for="season-name">Nazwa</Label><Input id="season-name" v-model="season.name" placeholder="2026/2027" required /></div><div class="grid grid-cols-2 gap-3"><div><Label for="season-start">Początek</Label><Input id="season-start" v-model="season.starts_on" type="date" required /></div><div><Label for="season-end">Koniec</Label><Input id="season-end" v-model="season.ends_on" type="date" required /></div></div><Button type="submit" variant="outline" class="w-full" :disabled="saving">Utwórz sezon</Button></form></Card><Card class="space-y-4"><h2>Utwórz rozgrywki</h2><form class="space-y-3" @submit.prevent="createCompetition"><div><Label for="competition-name">Nazwa</Label><Input id="competition-name" v-model="competition.name" placeholder="PZPN" required /></div><div><Label for="competition-season">Sezon</Label><select id="competition-season" v-model="competition.season_id" :class="selectClass" required><option v-for="item in activeSeasons" :key="item.id" :value="item.id">{{ item.name }}</option></select></div><div><Label for="competition-type">Typ</Label><select id="competition-type" v-model="competition.type" :class="selectClass"><option value="league">Liga</option><option value="cup">Puchar</option><option value="friendly">Towarzyskie</option><option value="tournament">Turniej</option></select></div><Button type="submit" variant="outline" class="w-full" :disabled="saving || !activeSeasons.length">Utwórz rozgrywki</Button></form></Card><Card class="space-y-4"><div class="flex items-center gap-2"><MapPin class="h-5 w-5 text-brand-700" /><h2>Utwórz miejsce</h2></div><form class="space-y-3" @submit.prevent="createVenue"><div><Label for="venue-name">Nazwa miejsca</Label><Input id="venue-name" v-model="venue.name" placeholder="Stadion Olimpijski" required /></div><div><Label for="venue-city">Miasto</Label><Input id="venue-city" v-model="venue.city" placeholder="Wrocław" /></div><div><Label for="venue-address">Adres</Label><Input id="venue-address" v-model="venue.address" placeholder="Opcjonalny adres" /></div><Button type="submit" variant="outline" class="w-full" :disabled="saving">Utwórz miejsce</Button></form></Card></div></details>
  </div>
</template>
