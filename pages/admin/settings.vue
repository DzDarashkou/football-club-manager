<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin'],
})

const items = [
  { label: 'Access', value: 'Admin only' },
  { label: 'Next scope', value: 'Club configuration' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Admin area"
    title="Settings"
    description="The protected settings area is ready for future club-level configuration work."
    :items="items"
  />
</template>
