<script setup lang="ts">
definePageMeta({
  allowedRoles: ['coach'],
})

const items = [
  { label: 'Attendance flow', value: 'Ready for implementation' },
  { label: 'Role access', value: 'Coach only' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Coach area"
    title="Games and attendance"
    description="Coach-specific game management will live here. The route is protected and ready for the attendance workflow."
    :items="items"
  />
</template>
