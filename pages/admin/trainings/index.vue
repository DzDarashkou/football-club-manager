<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Dumbbell, Plus } from 'lucide-vue-next'
import type { AdminGameSetupResponse, AdminTrainingsResponse, TrainingCreateInput } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin'] })
const selectClass = 'flex min-h-[44px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400'
const saving = ref(false); const error = ref<string | null>(null); const success = ref<string | null>(null)
const form = reactive<TrainingCreateInput>({ team_id: '', venue_id: null, weekday: 1, starts_on: '', ends_on: '', starts_at: '17:00', duration_minutes: 90, notes: null })
const { data: setupData } = await useFetch<AdminGameSetupResponse>('/api/admin/games/setup', { default: () => ({ seasons: [], competitions: [], venues: [], teams: [] }) })
const { data, refresh } = await useFetch<AdminTrainingsResponse>('/api/admin/trainings', { default: () => ({ trainings: [] }) })
const teams = computed(() => setupData.value?.teams.filter(team => team.is_active) ?? [])
const venues = computed(() => setupData.value?.venues.filter(venue => venue.is_active) ?? [])
const weekdayLabels = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
function format(value: string) { return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
async function createTraining() {
  saving.value = true; error.value = null; success.value = null
  try {
    await $fetch('/api/admin/trainings', { method: 'POST', body: { ...form, notes: form.notes?.trim() || null } })
    await refresh(); success.value = 'Cykliczne treningi zostały utworzone.'; form.starts_on = ''; form.ends_on = ''
  } catch (value) { error.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Nie udało się utworzyć treningów.' }
  finally { saving.value = false }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="space-y-2"><p class="eyebrow text-brand-700">Strefa administratora</p><h1>Treningi</h1><p class="text-body text-[color:var(--color-text-secondary)]">Utwórz harmonogram treningów dla konkretnej drużyny.</p></div>
    <p v-if="success" class="rounded-lg border border-[color:var(--status-confirmed-ring)] bg-[var(--status-confirmed-bg)] p-3 text-sm text-[var(--status-confirmed-text)]">{{ success }}</p>
    <p v-if="error" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-3 text-sm text-[var(--status-declined-text)]">{{ error }}</p>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card class="overflow-hidden p-0"><div class="border-b border-border p-4"><h2>Zaplanowane treningi</h2></div><p v-if="!data?.trainings.length" class="p-6 text-sm text-[color:var(--color-text-secondary)]">Nie zaplanowano jeszcze treningów.</p><div v-for="training in data?.trainings" :key="training.id" class="flex items-center gap-3 border-b border-border p-4 last:border-0"><Dumbbell class="h-5 w-5 shrink-0 text-brand-700" /><div><p class="font-medium">{{ training.team.name }}</p><p class="text-sm text-[color:var(--color-text-secondary)]">{{ format(training.scheduled_at) }} · {{ training.venue?.name || 'Miejsce do potwierdzenia' }}</p></div></div></Card>
      <Card class="space-y-4"><div class="flex items-center gap-2"><Plus class="h-5 w-5 text-brand-700" /><h2>Utwórz cykl</h2></div><form class="space-y-3" @submit.prevent="createTraining"><div><Label for="training-team">Drużyna</Label><select id="training-team" v-model="form.team_id" :class="selectClass" required><option value="" disabled>Wybierz drużynę</option><option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option></select></div><div><Label for="training-weekday">Dzień tygodnia</Label><select id="training-weekday" v-model.number="form.weekday" :class="selectClass"><option v-for="(label, index) in weekdayLabels" :key="label" :value="index + 1">{{ label }}</option></select></div><div class="grid grid-cols-2 gap-3"><div><Label for="training-from">Od</Label><Input id="training-from" v-model="form.starts_on" type="date" required /></div><div><Label for="training-to">Do</Label><Input id="training-to" v-model="form.ends_on" type="date" required /></div></div><div class="grid grid-cols-2 gap-3"><div><Label for="training-time">Godzina</Label><Input id="training-time" v-model="form.starts_at" type="time" required /></div><div><Label for="training-duration">Czas (min)</Label><Input id="training-duration" v-model.number="form.duration_minutes" type="number" min="15" max="360" required /></div></div><div><Label for="training-venue">Miejsce</Label><select id="training-venue" v-model="form.venue_id" :class="selectClass"><option :value="null">Miejsce do potwierdzenia</option><option v-for="venue in venues" :key="venue.id" :value="venue.id">{{ venue.name }}</option></select></div><div><Label for="training-notes">Notatki</Label><textarea id="training-notes" v-model="form.notes" class="min-h-20 w-full rounded-lg border border-input bg-surface p-3 text-sm" /></div><Button type="submit" class="w-full gap-2" :disabled="saving"><Dumbbell class="h-4 w-4" />{{ saving ? 'Zapisywanie...' : 'Utwórz treningi' }}</Button></form></Card>
    </div>
  </div>
</template>
