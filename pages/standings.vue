<script setup lang="ts">
import StandingsFilters from '@@/components/standings/StandingsFilters.vue'
import StandingsTable from '@@/components/standings/StandingsTable.vue'
import { useStandingsSelection } from '@@/composables/useStandingsSelection'
import type { StandingsHistory, StandingsSnapshot } from '@@/types/standings'

definePageMeta({ allowedRoles: ['admin', 'coach', 'parent'] })
const { role } = useAppAuth()
const { setup, setupPending, setupError, refreshSetup, teamId, groupId, groups, group } = await useStandingsSelection()
const snapshotId = ref('')
const historyPage = ref(0)
const requestFetch = useRequestFetch()
watch(groupId, () => { snapshotId.value = ''; historyPage.value = 0 }, { flush: 'sync' })
const { data, pending, error, refresh } = await useAsyncData(
  () => `standings:${groupId.value}:${snapshotId.value}`,
  async () => groupId.value ? requestFetch<{ snapshot: Omit<StandingsSnapshot, 'imported_by'> | null }>('/api/standings', {
    query: { group_id: groupId.value, ...(snapshotId.value ? { snapshot_id: snapshotId.value } : {}) },
  }) : { snapshot: null },
)
const { data: history, pending: historyPending, error: historyError, refresh: refreshHistory } = await useAsyncData(
  () => `standings-history:${groupId.value}:${historyPage.value}`,
  async (): Promise<StandingsHistory> => groupId.value ? requestFetch<StandingsHistory>('/api/standings/history', {
    query: { group_id: groupId.value, page: historyPage.value },
  }) : { snapshots: [], hasMore: false },
)
function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Europe/Warsaw' }).format(new Date(value))
}
</script>

<template>
  <div class="mx-auto min-w-0 max-w-6xl space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-2"><h1>Tabele ligowe</h1><p class="text-sm text-muted-foreground">Pozycje i wyniki drużyn Sporting Wrocław.</p></div>
      <NuxtLink v-if="role === 'admin'" to="/admin/standings" class="inline-flex min-h-11 items-center rounded-lg bg-brand-700 px-4 text-sm text-white">Importuj tabelę</NuxtLink>
    </div>
    <div v-if="setupError" role="alert" class="space-y-2"><p>Nie udało się pobrać drużyn i grup.</p><Button variant="outline" @click="refreshSetup()">Spróbuj ponownie</Button></div>
    <p v-else-if="setupPending" role="status">Ładowanie drużyn…</p>
    <template v-else>
      <Card class="space-y-4 p-4">
        <StandingsFilters v-model:team-id="teamId" v-model:group-id="groupId" :setup="setup" :groups="groups" />
        <p v-if="!setup.teams.length" class="text-sm">Brak drużyn. Administrator może je dodać w ustawieniach drużyn.</p>
        <p v-else-if="!groups.length" class="text-sm">Ta drużyna nie ma jeszcze przypisanych grup rozgrywkowych.</p>
      </Card>
      <Card v-if="group" class="min-w-0 space-y-4 p-4">
        <div class="space-y-1"><h2>{{ group.name }}</h2><p class="text-sm text-muted-foreground">{{ setup.seasons.find(season => season.id === group?.season_id)?.name }}</p></div>
        <div class="space-y-2">
          <Label for="standings-history">Wersja tabeli — data importu</Label>
          <select id="standings-history" v-model="snapshotId" class="min-h-11 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" :disabled="historyPending">
            <option value="">Najnowsza tabela</option>
            <option v-if="snapshotId && !history?.snapshots.some(item => item.id === snapshotId)" :value="snapshotId">Wybrana wersja historyczna</option>
            <option v-for="item in history?.snapshots" :key="item.id" :value="item.id">{{ formatDate(item.imported_at) }}</option>
          </select>
          <div v-if="historyPage > 0 || history?.hasMore" class="flex flex-wrap items-center gap-2">
            <Button variant="outline" :disabled="historyPage === 0 || historyPending" @click="historyPage--">Nowsze importy</Button>
            <span class="text-xs">Strona {{ historyPage + 1 }}</span>
            <Button variant="outline" :disabled="!history?.hasMore || historyPending" @click="historyPage++">Starsze importy</Button>
          </div>
          <p v-if="historyPending" role="status" class="text-sm">Ładowanie historii…</p>
          <div v-if="historyError" role="alert"><p>Nie udało się pobrać historii.</p><Button variant="outline" @click="refreshHistory()">Spróbuj ponownie</Button></div>
        </div>
        <p v-if="pending" role="status">Ładowanie tabeli…</p>
        <div v-else-if="error" role="alert"><p>Nie udało się pobrać tabeli.</p><Button variant="outline" @click="refresh()">Spróbuj ponownie</Button></div>
        <template v-else-if="data?.snapshot">
          <p class="text-sm text-muted-foreground">{{ snapshotId ? 'Wersja historyczna' : 'Ostatnia aktualizacja' }}: {{ formatDate(data.snapshot.imported_at) }}. Dane dodane ręcznie z Łączy Nas Piłka.</p>
          <StandingsTable :table="data.snapshot.table_data" :external-team-id="data.snapshot.external_team_id" />
        </template>
        <p v-else class="py-8 text-center text-sm">Brak tabeli dla tej grupy. Pojawi się po pierwszym imporcie administratora.</p>
      </Card>
    </template>
  </div>
</template>
