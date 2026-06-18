<script setup lang="ts">
definePageMeta({
  allowedRoles: ['coach'],
})

const quickStats = [
  { label: 'Assigned teams', value: '2 active squads' },
  { label: 'Next session', value: 'Today at 17:30' },
  { label: 'Pending RSVPs', value: '6 players' },
  { label: 'Matchday prep', value: '2 lineups to confirm' },
]
</script>

<template>
  <FeaturePlaceholder
    eyebrow="Coach area"
    title="Coach dashboard"
    description="This is the landing page for coach accounts. Authentication and role guards are active, and the next coach workflows can build on this protected shell."
    :items="quickStats"
  />
</template>
