<script setup lang="ts">
import { Tv } from 'lucide-vue-next'
import type { AdminGame } from '@@/types/admin-club'
const props = defineProps<{ game: Pick<AdminGame, 'has_broadcast' | 'broadcast_url'>, indicatorOnly?: boolean }>()
const safeUrl = computed(() => {
  try {
    const url = new URL(props.game.broadcast_url ?? '')
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch { return null }
})
</script>

<template>
  <template v-if="game.has_broadcast && safeUrl">
    <span v-if="indicatorOnly" class="inline-flex items-center gap-1 text-xs text-brand-700" title="Transmisja dostępna"><Tv class="h-4 w-4 shrink-0" aria-hidden="true" /><span class="sr-only">Transmisja dostępna</span></span>
    <a v-else :href="safeUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center gap-2 rounded-lg border border-input px-3 text-sm text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"><Tv class="h-5 w-5" aria-hidden="true" />Oglądaj transmisję</a>
  </template>
</template>
