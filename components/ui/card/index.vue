<!-- Card surface primitive for consistent radius, border, and padding defaults. -->
<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@@/lib/utils'

interface CardProps {
  as?: string
  class?: string
}

const props = withDefaults(defineProps<CardProps>(), {
  as: 'div',
  class: undefined,
})

const classes = computed(() => cn('card', props.class))
</script>

<template>
  <component :is="as" :class="classes">
    <slot />
  </component>
</template>
