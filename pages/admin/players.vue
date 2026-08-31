<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Pencil, Plus, UserRound } from 'lucide-vue-next'
import { watchDebounced } from '@vueuse/core'
import type { AdminPlayer, AdminPlayerInput, AdminPlayersResponse, AdminTeamsResponse } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin'] })

const selectClass = 'flex min-h-[44px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
const searchInput = ref('')
const search = ref('')
const teamFilter = ref('all')
const selectedPlayerId = ref<string | null>(null)
const isSubmitting = ref(false)
const pageError = ref<string | null>(null)
const pageSuccess = ref<string | null>(null)
type PlayerForm = Omit<AdminPlayerInput, 'shirt_number'> & { shirt_number: string | number }
const form = reactive<PlayerForm>({ full_name: '', shirt_number: '', date_of_birth: '', team_id: '', is_active: true })
watchDebounced(searchInput, (value) => { search.value = value.trim() }, { debounce: 300, maxWait: 900 })
const query = computed(() => ({ q: search.value, team_id: teamFilter.value }))
const { data: teamData } = await useFetch<AdminTeamsResponse>('/api/admin/teams', { default: () => ({ teams: [] }) })
const { data: playerData, pending, refresh } = await useFetch<AdminPlayersResponse>('/api/admin/players', { query, default: () => ({ players: [] }) })
const teams = computed(() => teamData.value?.teams ?? [])
const activeTeams = computed(() => teams.value.filter((team) => team.is_active))
const players = computed(() => playerData.value?.players ?? [])
const selectedPlayer = computed(() => players.value.find((player) => player.id === selectedPlayerId.value) ?? null)
const isCreateMode = computed(() => !selectedPlayer.value)
function resetForm() { selectedPlayerId.value = null; form.full_name = ''; form.shirt_number = ''; form.date_of_birth = ''; form.team_id = activeTeams.value[0]?.id ?? ''; form.is_active = true; pageError.value = null }
function editPlayer(player: AdminPlayer) { selectedPlayerId.value = player.id; form.full_name = player.full_name; form.shirt_number = player.shirt_number ?? ''; form.date_of_birth = player.date_of_birth; form.team_id = player.team_id; form.is_active = player.is_active; pageError.value = null }
async function submitForm() {
  pageError.value = null; pageSuccess.value = null; isSubmitting.value = true
  try {
    const payload = { ...form, full_name: form.full_name.trim(), shirt_number: form.shirt_number === '' ? null : form.shirt_number }
    if (selectedPlayer.value) { await $fetch(`/api/admin/players/${selectedPlayer.value.id}`, { method: 'PATCH', body: payload }); pageSuccess.value = 'Player updated.' }
    else { await $fetch('/api/admin/players', { method: 'POST', body: payload }); pageSuccess.value = 'Player created.' }
    await refresh(); resetForm()
  }
  catch (error) { const details = error as { data?: { statusMessage?: string }, message?: string }; pageError.value = details.data?.statusMessage || details.message || 'Unable to save the player.' }
  finally { isSubmitting.value = false }
}
function formatDate(value: string) { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) }
watch(activeTeams, (value) => { if (!form.team_id && value[0]) form.team_id = value[0].id }, { immediate: true })
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div class="space-y-2"><p class="eyebrow text-brand-700">Admin area</p><h1>Players</h1><p class="max-w-2xl text-body text-[color:var(--color-text-secondary)]">Create player records and assign every player to their current team.</p></div><Button class="gap-2" @click="resetForm"><Plus class="h-4 w-4" />Create player</Button></div>
    <div v-if="pageSuccess" class="rounded-lg border border-[color:var(--status-confirmed-ring)] bg-[var(--status-confirmed-bg)] px-4 py-3 text-sm text-[var(--status-confirmed-text)]">{{ pageSuccess }}</div>
    <div v-if="pageError" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] px-4 py-3 text-sm text-[var(--status-declined-text)]">{{ pageError }}</div>
    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
      <div class="space-y-6">
        <Card class="grid gap-3 md:grid-cols-3"><div class="md:col-span-2"><Label for="player-search">Search players</Label><Input id="player-search" v-model="searchInput" placeholder="Search by full name" /></div><div><Label for="team-filter">Team</Label><select id="team-filter" v-model="teamFilter" :class="selectClass"><option value="all">All teams</option><option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option></select></div></Card>
        <Card class="overflow-hidden p-0"><div class="flex items-center justify-between border-b border-border px-4 py-4"><div><h2>Roster</h2><p class="mt-1 text-label text-[color:var(--color-text-secondary)]">Showing up to 100 players</p></div><Badge variant="secondary">{{ pending ? 'Refreshing' : `${players.length} players` }}</Badge></div><div v-if="pending" class="px-4 py-8 text-center text-sm text-[color:var(--color-text-secondary)]">Loading players...</div><div v-else-if="!players.length" class="px-4 py-8 text-center text-sm text-[color:var(--color-text-secondary)]">{{ teams.length ? 'No players match the current filters.' : 'Create a team before adding players.' }}</div><div v-for="player in players" :key="player.id" class="flex flex-col gap-4 border-b border-border px-4 py-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between" :class="selectedPlayerId === player.id ? 'bg-brand-50/50' : ''"><NuxtLink :to="`/admin/players/${player.id}`" class="flex min-w-0 items-start gap-3 hover:text-brand-700"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserRound class="h-5 w-5" /></div><div class="min-w-0 space-y-1"><div class="flex flex-wrap items-center gap-2"><p class="font-medium">{{ player.full_name }}{{ player.shirt_number ? ` · #${player.shirt_number}` : '' }}</p><Badge :status="player.is_active ? 'confirmed' : 'neutral'">{{ player.is_active ? 'Active' : 'Inactive' }}</Badge></div><p class="text-sm text-[color:var(--color-text-secondary)]">{{ player.team.name }} · {{ player.team.age_group.name }}</p><p class="text-label text-[color:var(--color-text-secondary)]">Born {{ formatDate(player.date_of_birth) }}</p></div></NuxtLink><div class="flex flex-wrap gap-2"><NuxtLink :to="`/coach/players/${player.id}`" class="inline-flex min-h-9 items-center rounded-lg border border-input px-3 text-sm hover:bg-brand-50">Coach view</NuxtLink><Button variant="outline" size="sm" class="gap-2" @click="editPlayer(player)"><Pencil class="h-4 w-4" />Edit</Button></div></div></Card>
      </div>
      <Card class="h-fit space-y-5"><div class="space-y-2"><h2>{{ isCreateMode ? 'Create player' : 'Edit player' }}</h2><p class="text-body text-[color:var(--color-text-secondary)]">Player records are visible only to authorized club staff as further team workflows are added.</p></div><form class="space-y-4" @submit.prevent="submitForm"><div class="space-y-2"><Label for="player-name">Full name</Label><Input id="player-name" v-model="form.full_name" placeholder="Player full name" required /></div><div class="space-y-2"><Label for="shirt-number">Shirt number</Label><Input id="shirt-number" v-model="form.shirt_number" type="number" min="1" max="99" placeholder="Optional" /></div><div class="space-y-2"><Label for="date-of-birth">Date of birth</Label><Input id="date-of-birth" v-model="form.date_of_birth" type="date" required /></div><div class="space-y-2"><Label for="player-team">Team</Label><select id="player-team" v-model="form.team_id" :class="selectClass" required :disabled="!activeTeams.length"><option value="" disabled>Select team</option><option v-for="team in activeTeams" :key="team.id" :value="team.id">{{ team.name }} — {{ team.age_group.name }}</option></select></div><label class="flex min-h-[44px] items-center gap-3 text-sm"><input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-input text-brand-700 focus:ring-brand-400"> Active player</label><div class="flex flex-col gap-3 sm:flex-row"><Button type="submit" class="sm:flex-1" :disabled="isSubmitting || !activeTeams.length">{{ isSubmitting ? 'Saving...' : isCreateMode ? 'Create player' : 'Save changes' }}</Button><Button type="button" variant="outline" class="sm:flex-1" @click="resetForm">Clear form</Button></div></form></Card>
    </div>
  </div>
</template>
