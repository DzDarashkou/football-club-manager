<script setup lang="ts">
import { useForm } from 'vee-validate'
import StandingsFilters from '@@/components/standings/StandingsFilters.vue'
import StandingsGroupForm from '@@/components/standings/StandingsGroupForm.vue'
import StandingsTable from '@@/components/standings/StandingsTable.vue'
import { useStandingsSelection } from '@@/composables/useStandingsSelection'
import { parseStandingsJson, standingsImportSchema } from '@@/validators/standings'
import type { StandingsGroup } from '@@/types/standings'

definePageMeta({ allowedRoles: ['admin'] })
const { setup, setupPending, setupError, refreshSetup, teamId, groupId, groups, group } = await useStandingsSelection()
const success = ref('')
const failure = ref('')
const savedGroupId = ref('')
const { defineField, handleSubmit, isSubmitting, setFieldValue } = useForm({ initialValues: { json: '', external_team_id: '' } })
const [json, jsonAttrs] = defineField('json')
const [externalTeamId, externalTeamAttrs] = defineField('external_team_id')
const preview = computed(() => {
  if (!json.value.trim()) return { table: null, error: '' }
  try { return { table: parseStandingsJson(json.value), error: '' } }
  catch (error) { return { table: null, error: error instanceof Error ? error.message : 'Niepoprawne dane.' } }
})
const wrongGroup = computed(() => !!(group.value?.external_play_id && preview.value.table && group.value.external_play_id !== preview.value.table.play.id))
watch(json, () => { setFieldValue('external_team_id', ''); failure.value = ''; success.value = '' })
watch(groupId, () => { failure.value = ''; success.value = '' })

async function groupCreated(created: StandingsGroup): Promise<void> {
  await refreshSetup()
  teamId.value = created.team_id
  groupId.value = created.id
  success.value = 'Grupa została dodana. Teraz możesz zaimportować tabelę.'
  savedGroupId.value = created.id
}

const submit = handleSubmit(async () => {
  failure.value = ''; success.value = ''
  const parsed = standingsImportSchema.safeParse({ group_id: groupId.value, external_team_id: externalTeamId.value, table: preview.value.table })
  if (!parsed.success || wrongGroup.value) {
    failure.value = 'Sprawdź JSON, grupę oraz wybór drużyny klubu w tabeli.'
    return
  }
  try {
    await $fetch('/api/admin/standings/import', { method: 'POST', body: parsed.data })
    savedGroupId.value = parsed.data.group_id
    setFieldValue('json', '')
    setFieldValue('external_team_id', '')
    await refreshSetup()
    // Invalidate cached latest tables and history after saving a new snapshot.
    clearNuxtData(key => key.startsWith('standings:') || key.startsWith('standings-history:'))
    success.value = 'Tabela została zapisana jako nowa wersja. Poprzednie importy pozostały w historii.'
  }
  catch (error) {
    const details = error as { data?: { data?: { message?: string } } }
    failure.value = details.data?.data?.message ?? 'Nie udało się zapisać tabeli. Spróbuj ponownie.'
  }
})
</script>

<template>
  <div class="mx-auto min-w-0 max-w-6xl space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-2"><h1>Import tabel ligowych</h1><p class="text-sm text-muted-foreground">Wklej odpowiedź JSON z Łączy Nas Piłka. Każdy zapis tworzy nową wersję tabeli.</p></div>
      <NuxtLink to="/standings" class="inline-flex min-h-11 items-center rounded-lg border border-input px-4 text-sm">Zobacz tabele</NuxtLink>
    </div>
    <div v-if="setupError" role="alert"><p>Nie udało się pobrać drużyn i grup.</p><Button variant="outline" @click="refreshSetup()">Spróbuj ponownie</Button></div>
    <p v-else-if="setupPending" role="status">Ładowanie…</p>
    <template v-else>
      <div v-if="success" role="status" class="rounded-lg bg-brand-50 p-4 text-brand-900">
        {{ success }} <NuxtLink :to="{ path: '/standings', query: { group: savedGroupId } }" class="underline">Otwórz tabelę</NuxtLink>
      </div>
      <Card class="space-y-4 p-4">
        <StandingsFilters v-model:team-id="teamId" v-model:group-id="groupId" :setup="setup" :groups="groups" :disabled="isSubmitting" />
        <p v-if="!setup.teams.length" class="text-sm">Najpierw <NuxtLink to="/admin/teams" class="underline">dodaj drużyny</NuxtLink>.</p>
      </Card>
      <StandingsGroupForm v-if="!isSubmitting" :setup="setup" :team-id="teamId" @created="groupCreated" />
      <form class="space-y-4" @submit="submit">
        <Card class="space-y-4 p-4">
          <div class="space-y-2">
            <Label for="standings-json">Odpowiedź JSON z tabelą</Label>
            <p id="standings-json-hint" class="text-sm text-muted-foreground">Wklej cały obiekt z polami league, play i rows (maks. 500 KB). Podgląd pojawi się poniżej.</p>
            <textarea id="standings-json" v-model="json" v-bind="jsonAttrs" rows="12" maxlength="500000" spellcheck="false" :disabled="isSubmitting" class="w-full rounded-lg border border-input bg-surface p-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" :aria-invalid="!!preview.error" aria-describedby="standings-json-hint standings-json-error" />
            <p v-if="preview.error" id="standings-json-error" role="alert" class="text-sm text-red-700">{{ preview.error }}</p>
          </div>
          <template v-if="preview.table">
            <p class="break-words text-sm">Grupa w JSON: <strong class="font-medium">{{ preview.table.play.name }}</strong> · {{ preview.table.rows.length }} drużyn</p>
            <p v-if="wrongGroup" role="alert" class="text-sm text-red-700">Ten JSON pochodzi z innej grupy rozgrywkowej. Wybierz właściwą grupę lub dodaj nową.</p>
            <div class="space-y-2">
              <Label for="standings-club-team">Drużyna klubu w importowanej tabeli</Label>
              <select id="standings-club-team" v-model="externalTeamId" v-bind="externalTeamAttrs" :disabled="isSubmitting" class="min-h-11 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
                <option value="" disabled>Wybierz odpowiednik {{ setup.teams.find(team => team.id === teamId)?.name }}</option>
                <option v-for="row in preview.table.rows" :key="row.team.id" :value="row.team.id">{{ row.team.name }}</option>
              </select>
              <p class="text-xs text-muted-foreground">Wybrana drużyna zostanie wyróżniona w tabeli.</p>
            </div>
          </template>
          <p v-if="failure" role="alert" class="text-sm text-red-700">{{ failure }}</p>
          <Button type="submit" :disabled="isSubmitting || !groupId || !preview.table || !externalTeamId || wrongGroup" class="w-full sm:w-auto">{{ isSubmitting ? 'Zapisywanie…' : 'Zapisz nową wersję tabeli' }}</Button>
        </Card>
        <Card v-if="preview.table" class="min-w-0 space-y-4 p-4"><h2>Podgląd importu</h2><StandingsTable :table="preview.table" :external-team-id="externalTeamId" /></Card>
      </form>
    </template>
  </div>
</template>
