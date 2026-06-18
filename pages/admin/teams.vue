<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin'],
})

const items = [
  { label: 'Access', value: 'Admin only' },
  { label: 'Next scope', value: 'Team administration' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Admin area"
    title="Teams"
    description="The team administration route is protected and available for the next implementation pass."
    :items="items"
  />
</template>
