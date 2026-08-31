<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Pencil, Plus, Shirt } from 'lucide-vue-next'
import type { AdminAgeGroup, AdminAgeGroupInput, AdminTeam, AdminTeamInput, AdminAgeGroupsResponse, AdminTeamsResponse } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin'] })

const selectClass = 'flex min-h-[44px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
const selectedTeamId = ref<string | null>(null)
const isSubmitting = ref(false)
const isCreatingAgeGroup = ref(false)
const pageError = ref<string | null>(null)
const pageSuccess = ref<string | null>(null)
const teamForm = reactive<AdminTeamInput>({ name: '', age_group_id: '', is_active: true })
const ageGroupForm = reactive<AdminAgeGroupInput>({ name: '', birth_year_from: new Date().getFullYear() - 10, birth_year_to: new Date().getFullYear() - 9 })
const { data: ageGroupData, pending: ageGroupsPending, refresh: refreshAgeGroups } = await useFetch<AdminAgeGroupsResponse>('/api/admin/age-groups', { default: () => ({ ageGroups: [] }) })
const { data: teamData, pending: teamsPending, refresh: refreshTeams } = await useFetch<AdminTeamsResponse>('/api/admin/teams', { default: () => ({ teams: [] }) })
const ageGroups = computed(() => ageGroupData.value?.ageGroups ?? [])
const teams = computed(() => teamData.value?.teams ?? [])
const activeAgeGroups = computed(() => ageGroups.value.filter((ageGroup) => ageGroup.is_active))
const selectedTeam = computed(() => teams.value.find((team) => team.id === selectedTeamId.value) ?? null)
const isCreateMode = computed(() => !selectedTeam.value)
const editorTitle = computed(() => isCreateMode.value ? 'Create team' : 'Edit team')

function resetTeamForm() {
  selectedTeamId.value = null
  teamForm.name = ''
  teamForm.age_group_id = activeAgeGroups.value[0]?.id ?? ''
  teamForm.is_active = true
  pageError.value = null
}
function editTeam(team: AdminTeam) {
  selectedTeamId.value = team.id
  teamForm.name = team.name
  teamForm.age_group_id = team.age_group_id
  teamForm.is_active = team.is_active
  pageError.value = null
}
async function submitTeam() {
  pageError.value = null
  pageSuccess.value = null
  isSubmitting.value = true
  try {
    const payload = { ...teamForm, name: teamForm.name.trim() }
    if (selectedTeam.value) {
      await $fetch(`/api/admin/teams/${selectedTeam.value.id}`, { method: 'PATCH', body: payload })
      pageSuccess.value = 'Team updated.'
    }
    else {
      await $fetch('/api/admin/teams', { method: 'POST', body: payload })
      pageSuccess.value = 'Team created.'
    }
    await refreshTeams()
    resetTeamForm()
  }
  catch (error) {
    const details = error as { data?: { statusMessage?: string }, message?: string }
    pageError.value = details.data?.statusMessage || details.message || 'Unable to save the team.'
  }
  finally { isSubmitting.value = false }
}
async function createAgeGroup() {
  pageError.value = null
  isCreatingAgeGroup.value = true
  try {
    const response = await $fetch<{ ageGroup: AdminAgeGroup }>('/api/admin/age-groups', { method: 'POST', body: { ...ageGroupForm, name: ageGroupForm.name.trim() } })
    await refreshAgeGroups()
    teamForm.age_group_id = response.ageGroup.id
    ageGroupForm.name = ''
    pageSuccess.value = 'Age group created and selected.'
  }
  catch (error) {
    const details = error as { data?: { statusMessage?: string }, message?: string }
    pageError.value = details.data?.statusMessage || details.message || 'Unable to create the age group.'
  }
  finally { isCreatingAgeGroup.value = false }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-2"><p class="eyebrow text-brand-700">Admin area</p><h1>Teams</h1><p class="max-w-2xl text-body text-[color:var(--color-text-secondary)]">Create teams for an age group and keep the club structure current.</p></div>
      <Button class="gap-2" @click="resetTeamForm"><Plus class="h-4 w-4" />Create team</Button>
    </div>
    <div v-if="pageSuccess" class="rounded-lg border border-[color:var(--status-confirmed-ring)] bg-[var(--status-confirmed-bg)] px-4 py-3 text-sm text-[var(--status-confirmed-text)]">{{ pageSuccess }}</div>
    <div v-if="pageError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] px-4 py-3 text-sm text-[var(--status-declined-text)]">{{ pageError }}</div>
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
      <Card class="overflow-hidden p-0">
        <div class="flex items-center justify-between border-b border-border px-4 py-4"><div><h2>Club teams</h2><p class="mt-1 text-label text-[color:var(--color-text-secondary)]">{{ teams.length }} team{{ teams.length === 1 ? '' : 's' }}</p></div><Badge variant="secondary">{{ teamsPending ? 'Refreshing' : 'Live' }}</Badge></div>
        <div v-if="teamsPending" class="px-4 py-8 text-center text-sm text-[color:var(--color-text-secondary)]">Loading teams...</div>
        <div v-else-if="!teams.length" class="px-4 py-8 text-center text-sm text-[color:var(--color-text-secondary)]">Create an age group and then add the first team.</div>
        <div v-for="team in teams" :key="team.id" class="flex flex-col gap-4 border-b border-border px-4 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between" :class="selectedTeamId === team.id ? 'bg-brand-50/50' : ''">
          <div class="flex min-w-0 items-start gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Shirt class="h-5 w-5" /></div><div class="min-w-0 space-y-1"><div class="flex flex-wrap items-center gap-2"><p class="font-medium">{{ team.name }}</p><Badge :status="team.is_active ? 'confirmed' : 'neutral'">{{ team.is_active ? 'Active' : 'Inactive' }}</Badge></div><p class="text-sm text-[color:var(--color-text-secondary)]">{{ team.age_group.name }} · {{ team.age_group.birth_year_from }}–{{ team.age_group.birth_year_to }}</p><p class="text-label text-[color:var(--color-text-secondary)]">{{ team.player_count }} player{{ team.player_count === 1 ? '' : 's' }}</p></div></div>
          <Button variant="outline" size="sm" class="gap-2" @click="editTeam(team)"><Pencil class="h-4 w-4" />Edit</Button>
        </div>
      </Card>
      <div class="space-y-6">
        <Card class="space-y-5"><div class="space-y-2"><h2>{{ editorTitle }}</h2><p class="text-body text-[color:var(--color-text-secondary)]">A team belongs to one age group. Deactivate it when it should no longer receive new players.</p></div>
          <form class="space-y-4" @submit.prevent="submitTeam"><div class="space-y-2"><Label for="team-name">Team name</Label><Input id="team-name" v-model="teamForm.name" placeholder="Sporting Wrocław A" required /></div><div class="space-y-2"><Label for="team-age-group">Age group</Label><select id="team-age-group" v-model="teamForm.age_group_id" :class="selectClass" required :disabled="ageGroupsPending || !activeAgeGroups.length"><option value="" disabled>Select age group</option><option v-for="ageGroup in activeAgeGroups" :key="ageGroup.id" :value="ageGroup.id">{{ ageGroup.name }} ({{ ageGroup.birth_year_from }}–{{ ageGroup.birth_year_to }})</option></select></div><label class="flex min-h-[44px] items-center gap-3 text-sm"><input v-model="teamForm.is_active" type="checkbox" class="h-4 w-4 rounded border-input text-brand-700 focus:ring-brand-400"> Active team</label><div class="flex flex-col gap-3 sm:flex-row"><Button type="submit" class="sm:flex-1" :disabled="isSubmitting || !activeAgeGroups.length">{{ isSubmitting ? 'Saving...' : isCreateMode ? 'Create team' : 'Save changes' }}</Button><Button type="button" variant="outline" class="sm:flex-1" @click="resetTeamForm">Clear form</Button></div></form>
        </Card>
        <Card class="space-y-4"><div><h2>Create age group</h2><p class="mt-1 text-label text-[color:var(--color-text-secondary)]">For example, Orlik for players born in 2015–2016.</p></div><form class="space-y-4" @submit.prevent="createAgeGroup"><div class="space-y-2"><Label for="age-group-name">Age group name</Label><Input id="age-group-name" v-model="ageGroupForm.name" placeholder="Orlik" required /></div><div class="grid grid-cols-2 gap-3"><div class="space-y-2"><Label for="birth-year-from">From</Label><Input id="birth-year-from" v-model="ageGroupForm.birth_year_from" type="number" min="1900" max="2100" required /></div><div class="space-y-2"><Label for="birth-year-to">To</Label><Input id="birth-year-to" v-model="ageGroupForm.birth_year_to" type="number" min="1900" max="2100" required /></div></div><Button type="submit" variant="outline" class="w-full" :disabled="isCreatingAgeGroup">{{ isCreatingAgeGroup ? 'Creating...' : 'Create age group' }}</Button></form></Card>
      </div>
    </div>
  </div>
</template>
