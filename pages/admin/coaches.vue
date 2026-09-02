<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin'],
})

const items = [
  { label: 'Dostęp', value: 'Tylko administrator' },
  { label: 'Następny zakres', value: 'Przypisania i uprawnienia trenerów' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Strefa administratora"
    title="Trenerzy"
    description="Zarządzanie trenerami zostanie wdrożone na tej chronionej trasie."
    :items="items"
  />
</template>
