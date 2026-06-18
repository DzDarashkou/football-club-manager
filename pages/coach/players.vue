<script setup lang="ts">
definePageMeta({
  allowedRoles: ['coach'],
})

const items = [
  { label: 'Roster access', value: 'Protected' },
  { label: 'Future scope', value: 'Player list and status' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Coach area"
    title="Players"
    description="Coach roster management will be added here in a later feature pass."
    :items="items"
  />
</template>
