<!-- Input primitive matching shadcn spacing and the club focus-ring tokens. -->
<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@@/lib/utils'

interface InputProps {
  class?: string
}

const props = defineProps<InputProps>()
const model = defineModel<string | number>()
const attrs = useAttrs()
const classes = computed(() => cn(
  'flex min-h-[44px] w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
  props.class,
))
</script>

<template>
  <input v-model="model" v-bind="attrs" :class="classes">
</template>
