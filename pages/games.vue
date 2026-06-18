<script setup lang="ts">
definePageMeta({
  allowedRoles: ['parent', 'coach'],
})

const items = [
  { label: 'Visible to', value: 'Parents and coaches' },
  { label: 'Next scope', value: 'Match list and RSVP state' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Shared area"
    title="Games"
    description="This shared protected route is ready for fixture lists and attendance responses."
    :items="items"
  />
</template>
