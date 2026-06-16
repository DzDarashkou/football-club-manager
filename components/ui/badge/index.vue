<!-- Badge primitive with optional status color mapping for attendance states. -->
<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { computed } from 'vue'
import { cn } from '@@/lib/utils'
import type { StatusKey } from '@@/types/design'

const badgeVariants = cva(
  'inline-flex items-center rounded-pill border border-transparent px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-muted text-muted-foreground',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  status?: StatusKey
  class?: string
}

const props = withDefaults(defineProps<BadgeProps>(), {
  status: undefined,
  class: undefined,
})

const statusClasses: Record<StatusKey, string> = {
  confirmed: 'badge-base badge-confirmed',
  declined: 'badge-base badge-declined',
  pending: 'badge-base badge-pending',
  neutral: 'badge-base badge-neutral',
}

const classes = computed(() => (
  props.status
    ? cn(statusClasses[props.status], props.class)
    : cn(badgeVariants({ variant: props.variant }), props.class)
))
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
