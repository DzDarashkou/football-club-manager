<script setup lang="ts">
definePageMeta({
  allowedRoles: ['coach'],
})

const items = [
  { label: 'Assigned teams', value: 'Role filtered' },
  { label: 'Future scope', value: 'Team roster views' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Coach area"
    title="Teams"
    description="This protected coach route is ready for team-level views and assignments."
    :items="items"
  />
</template>
