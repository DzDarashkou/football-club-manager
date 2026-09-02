<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin', 'parent', 'coach'],
})

const items = [
  { label: 'Widoczne dla', value: 'Rodziców i trenerów' },
  { label: 'Następny zakres', value: 'Kalendarz treningów i meczów' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Wspólna strefa"
    title="Kalendarz"
    description="Chroniona trasa kalendarza jest gotowa na funkcje planowania."
    :items="items"
  />
</template>
