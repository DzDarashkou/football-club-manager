<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin'],
})

const items = [
  { label: 'Access', value: 'Admin only' },
  { label: 'Next scope', value: 'Player records and assignments' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Admin area"
    title="Players"
    description="This protected route will host player management once that feature set starts."
    :items="items"
  />
</template>
