<script setup lang="ts">
definePageMeta({
  allowedRoles: ['parent'],
})

const items = [
  { label: 'Linked children', value: 'Coming next' },
  { label: 'Role access', value: 'Parent only' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Parent area"
    title="My children"
    description="This protected page is reserved for parent-linked player information and quick stats."
    :items="items"
  />
</template>
