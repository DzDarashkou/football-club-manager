<script setup lang="ts">
definePageMeta({
  allowedRoles: ['parent'],
})

const items = [
  { label: 'Powiązane dzieci', value: 'Wkrótce' },
  { label: 'Dostęp', value: 'Tylko rodzic' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Strefa rodzica"
    title="Moje dzieci"
    description="Ta chroniona strona jest przeznaczona na informacje o powiązanych zawodnikach i szybkie statystyki."
    :items="items"
  />
</template>
