<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin'],
})

const items = [
  { label: 'Access', value: 'Admin only' },
  { label: 'Next scope', value: 'Coach assignments and permissions' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Admin area"
    title="Coaches"
    description="Coach administration will be implemented on top of this protected route."
    :items="items"
  />
</template>
