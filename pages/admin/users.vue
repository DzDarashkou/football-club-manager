<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin'],
})

const items = [
  { label: 'Access', value: 'Admin only' },
  { label: 'Next scope', value: 'Manual user management' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Admin area"
    title="Users"
    description="This protected admin route is ready for future user management tools."
    :items="items"
  />
</template>
