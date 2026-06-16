<!-- Form label primitive using the shared label type token. -->
<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@@/lib/utils'

interface LabelProps {
  for?: string
  class?: string
}

const props = defineProps<LabelProps>()
const classes = computed(() => cn('text-label font-medium text-[color:var(--color-text-primary)]', props.class))
</script>

<template>
  <label :for="props.for" :class="classes">
    <slot />
  </label>
</template>
