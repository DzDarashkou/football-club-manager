<script setup lang="ts">
definePageMeta({
  allowedRoles: ['parent', 'coach'],
})

const items = [
  { label: 'Visible to', value: 'Parents and coaches' },
  { label: 'Next scope', value: 'Training and match calendar' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Shared area"
    title="Calendar"
    description="The protected calendar route is in place and ready for scheduling features."
    :items="items"
  />
</template>
