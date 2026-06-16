<!-- Reusable club logo lockup for top bars, sidebars, and public auth screens. -->
<script setup lang="ts">
interface Props {
  variant?: 'full' | 'mark'
  inverted?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'full',
  inverted: true,
})
</script>

<template>
  <div class="flex items-center gap-3">
    <img
      src="/images/logo-trans.png"
      alt="Sporting Wroclaw crest"
      class="h-9 w-9 rounded-full object-cover sm:h-10 sm:w-10"
    >
    <div v-if="variant === 'full'" class="flex flex-col leading-none">
      <span class="eyebrow" :class="inverted ? 'text-brand-200' : 'text-brand-700'">
        Klub Sportowy
      </span>
      <span class="text-sm font-medium tracking-wide" :class="inverted ? 'text-white' : 'text-brand-800'">
        Sporting Wroclaw
      </span>
    </div>
  </div>
</template>
