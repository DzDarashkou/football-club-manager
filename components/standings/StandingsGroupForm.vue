<script setup lang="ts">
import { useForm } from 'vee-validate'
import { standingsGroupSchema } from '@@/validators/standings'
import type { StandingsGroup, StandingsSetup } from '@@/types/standings'

const props = defineProps<{ setup: StandingsSetup, teamId: string }>()
const emit = defineEmits<{ created: [group: StandingsGroup] }>()
const failure = ref('')
const { defineField, handleSubmit, isSubmitting, setFieldError, errors, setFieldValue } = useForm({ initialValues: { name: '', season_id: props.setup.seasons[0]?.id ?? '' } })
const [name, nameAttrs] = defineField('name')
const [seasonId, seasonAttrs] = defineField('season_id')
const presets = [
  'Wrocław: IV liga okręgowa D2 Młodzik Grupa 1',
  'Wrocław: III liga okręgowa D2 Młodzik',
  'Wrocław: V liga okręgowa D1 Młodzik Grupa 1',
]
const submit = handleSubmit(async (values) => {
  failure.value = ''
  const parsed = standingsGroupSchema.safeParse({ ...values, team_id: props.teamId })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (field === 'name' || field === 'season_id') setFieldError(field, field === 'name' ? 'Podaj nazwę grupy.' : 'Wybierz sezon.')
      else failure.value = 'Najpierw wybierz drużynę.'
    }
    return
  }
  try {
    const result = await $fetch<{ group: StandingsGroup }>('/api/admin/standings/groups', { method: 'POST', body: parsed.data })
    setFieldValue('name', '')
    emit('created', result.group)
  }
  catch (error) {
    const details = error as { data?: { data?: { message?: string } } }
    failure.value = details.data?.data?.message ?? 'Nie udało się dodać grupy. Spróbuj ponownie.'
  }
})
</script>

<template>
  <details class="rounded-xl border border-border bg-surface p-4">
    <summary class="min-h-11 cursor-pointer py-2 font-medium">Dodaj grupę rozgrywkową do wybranej drużyny</summary>
    <form class="mt-3 space-y-4" @submit="submit">
      <p class="text-sm">Drużyna: {{ setup.teams.find(team => team.id === teamId)?.name ?? 'Wybierz drużynę powyżej' }}</p>
      <div class="space-y-2">
        <Label for="new-group-season">Sezon</Label>
        <select id="new-group-season" v-model="seasonId" v-bind="seasonAttrs" :disabled="isSubmitting" class="min-h-11 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" :aria-invalid="!!errors.season_id" aria-describedby="group-season-error">
          <option value="" disabled>Wybierz sezon</option><option v-for="season in setup.seasons" :key="season.id" :value="season.id">{{ season.name }}</option>
        </select>
        <p id="group-season-error" class="text-sm text-red-700">{{ errors.season_id }}</p>
        <p v-if="!setup.seasons.length" class="text-sm">Najpierw dodaj sezon w sekcji <NuxtLink to="/admin/games" class="underline">Mecze</NuxtLink>.</p>
      </div>
      <div class="space-y-2">
        <Label for="new-group-name">Nazwa grupy</Label>
        <Input id="new-group-name" v-model="name" v-bind="nameAttrs" list="standings-group-presets" maxlength="250" :disabled="isSubmitting" :aria-invalid="!!errors.name" aria-describedby="group-name-error" />
        <datalist id="standings-group-presets"><option v-for="preset in presets" :key="preset" :value="preset" /></datalist>
        <p id="group-name-error" class="text-sm text-red-700">{{ errors.name }}</p>
      </div>
      <p v-if="failure" role="alert" class="text-sm text-red-700">{{ failure }}</p>
      <Button type="submit" :disabled="isSubmitting || !teamId || !setup.seasons.length">{{ isSubmitting ? 'Zapisywanie…' : 'Dodaj grupę' }}</Button>
    </form>
  </details>
</template>
