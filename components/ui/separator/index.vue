<!-- Lightweight separator primitive for card and list dividers. -->
<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@@/lib/utils'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  class?: string
}

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
  class: undefined,
})

const classes = computed(() => cn(
  'shrink-0 bg-border',
  props.orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
  props.class,
))
</script>

<template>
  <div :class="classes" :aria-orientation="orientation" role="separator" />
</template>
