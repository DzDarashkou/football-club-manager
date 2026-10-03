<script setup lang="ts">
import CoachGameDetails from '@@/components/games/CoachGameDetails.vue'

definePageMeta({ allowedRoles: ['admin', 'coach'] })

const route = useRoute()
</script>

<template>
  <CoachGameDetails
    :key="String(route.params.id)"
    :game-id="String(route.params.id)"
  />
</template>
