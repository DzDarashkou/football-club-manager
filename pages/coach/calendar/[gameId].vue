<script setup lang="ts">
import CoachGameDetails from '@@/components/games/CoachGameDetails.vue'

definePageMeta({ allowedRoles: ['admin', 'coach', 'parent'] })

const route = useRoute()
</script>

<template>
  <CoachGameDetails
    :key="String(route.params.gameId)"
    :game-id="String(route.params.gameId)"
    back-to="/coach/calendar"
    back-label="← Wróć do kalendarza"
  />
</template>
