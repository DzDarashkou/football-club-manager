<script setup lang="ts">
import type { AdminTrainingSession, TrainingStatus } from '@@/types/admin-club'
import { warsawDateTime, trainingDateToIso } from '@@/shared/utils/training-time'
const props = defineProps<{ training: AdminTrainingSession }>()
const emit = defineEmits<{ saved: [] }>()
const editing = ref(false)
const status = ref<TrainingStatus>('scheduled')
const date = ref('')
const saving = ref(false)
const error = ref('')
const success = ref('')
const id = useId()
function startEditing() {
  status.value = props.training.status
  date.value = warsawDateTime(props.training.scheduled_at)
  error.value = ''; success.value = ''; editing.value = true
}
async function save() {
  error.value = ''
  if (status.value === 'moved') {
    const instant = trainingDateToIso(date.value)
    if (!instant || Date.parse(instant) === Date.parse(props.training.original_scheduled_at ?? props.training.scheduled_at)) {
      error.value = 'Podaj nowy termin, inny niż pierwotny (czas polski).'
      return
    }
  }
  saving.value = true
  try {
    await $fetch(`/api/admin/trainings/${props.training.id}`, { method: 'PATCH', body: { status: status.value, ...(status.value === 'moved' ? { scheduled_at: date.value } : {}) } })
    editing.value = false
    success.value = 'Zmiany treningu zostały zapisane.'
    emit('saved')
  } catch (value) {
    error.value = (value as { data?: { statusMessage?: string } }).data?.statusMessage || 'Nie udało się zapisać treningu.'
  } finally { saving.value = false }
}
</script>

<template>
  <div class="space-y-3">
    <Button v-if="!editing" variant="outline" @click="startEditing">Edytuj trening</Button>
    <p v-if="success" role="status" class="text-sm">{{ success }}</p>
    <form v-if="editing" class="space-y-3" @submit.prevent="save">
      <p class="text-sm">Zmiana dotyczy tylko tego treningu.</p>
      <div>
        <Label :for="`${id}-status`">Status treningu</Label>
        <select :id="`${id}-status`" v-model="status" :disabled="saving" class="min-h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
          <option value="scheduled">Zaplanowany</option><option value="moved">Przeniesiony</option><option value="cancelled">Odwołany</option>
        </select>
      </div>
      <div v-if="status === 'moved'">
        <Label :for="`${id}-date`">Nowy termin (czas polski)</Label>
        <Input :id="`${id}-date`" v-model="date" type="datetime-local" required :disabled="saving" />
      </div>
      <p v-if="status === 'scheduled' && training.original_scheduled_at" class="text-sm">Przywrócenie statusu „Zaplanowany” przywróci pierwotny termin treningu.</p>
      <p v-if="error" role="alert" class="rounded-lg bg-[var(--status-declined-bg)] p-3 text-sm text-[var(--status-declined-text)]">{{ error }}</p>
      <div class="flex flex-wrap gap-2">
        <Button type="submit" :disabled="saving">{{ saving ? 'Zapisywanie...' : 'Zapisz zmiany' }}</Button>
        <Button type="button" variant="outline" :disabled="saving" @click="editing = false">Anuluj</Button>
      </div>
    </form>
  </div>
</template>
