<script setup lang="ts">
const enabled = defineModel<boolean>('enabled', { required: true })
const url = defineModel<string | null>('url', { required: true })
const id = useId()
const inputUrl = computed({ get: () => url.value ?? '', set: (value: string | number) => { url.value = String(value).trim() || null } })
watch(enabled, value => { if (!value) url.value = null })
</script>

<template>
  <div class="space-y-2">
    <label class="flex min-h-11 items-center gap-3"><input v-model="enabled" type="checkbox" class="h-5 w-5">Transmisja dostępna</label>
    <template v-if="enabled">
      <Label :for="id">Link do transmisji</Label>
      <Input :id="id" v-model="inputUrl" type="url" pattern="https?://.+" maxlength="2048" required placeholder="https://…" title="Podaj link zaczynający się od http:// lub https://." />
    </template>
  </div>
</template>
