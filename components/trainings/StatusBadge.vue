<script setup lang="ts">
import { CalendarCheck, CalendarClock, CalendarX } from 'lucide-vue-next'
import type { TrainingStatus } from '@@/types/admin-club'
defineProps<{ status: TrainingStatus }>()
const states = {
  scheduled: { label: 'Zaplanowany', color: 'confirmed', icon: CalendarCheck },
  moved: { label: 'Przeniesiony', color: 'pending', icon: CalendarClock },
  cancelled: { label: 'Odwołany', color: 'declined', icon: CalendarX },
} as const
</script>

<template>
  <Badge :status="states[status].color" class="inline-flex items-center gap-1"><component :is="states[status].icon" class="h-4 w-4" aria-hidden="true" />{{ states[status].label }}</Badge>
</template>
