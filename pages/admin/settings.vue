<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin'],
})

const items = [
  { label: 'Dostęp', value: 'Tylko administrator' },
  { label: 'Następny zakres', value: 'Konfiguracja klubu' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Strefa administratora"
    title="Ustawienia"
    description="Chroniona strefa ustawień jest gotowa na przyszłą konfigurację klubu."
    :items="items"
  />
</template>
