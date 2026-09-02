<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin', 'coach'],
})

const quickStats = [
  { label: 'Przypisane drużyny', value: '2 aktywne zespoły' },
  { label: 'Następne zajęcia', value: 'Dzisiaj o 17:30' },
  { label: 'Oczekujące odpowiedzi', value: '6 zawodników' },
  { label: 'Przygotowanie meczu', value: '2 składy do potwierdzenia' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Strefa trenera"
    title="Panel trenera"
    description="To strona startowa kont trenerskich. Uwierzytelnianie i kontrola ról są aktywne, a kolejne funkcje trenera mogą korzystać z tej chronionej struktury."
    :items="quickStats"
  />
</template>
