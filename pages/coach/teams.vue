<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin', 'coach'],
})

const items = [
  { label: 'Przypisane drużyny', value: 'Filtrowane według roli' },
  { label: 'Przyszły zakres', value: 'Widoki składów drużyn' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Strefa trenera"
    title="Drużyny"
    description="Ta chroniona trasa trenera jest gotowa na widoki i przypisania na poziomie drużyny."
    :items="items"
  />
</template>
