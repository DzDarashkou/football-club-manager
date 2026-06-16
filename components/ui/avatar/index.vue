<!-- Avatar primitive for initials or image-driven circular identity markers. -->
<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@@/lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  class?: string
}

const props = withDefaults(defineProps<AvatarProps>(), {
  src: undefined,
  alt: 'Avatar',
  fallback: '',
  class: undefined,
})

const classes = computed(() => cn(
  'relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700',
  props.class,
))
</script>

<template>
  <div :class="classes">
    <img v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover">
    <span v-else class="text-label font-medium">{{ fallback }}</span>
  </div>
</template>
