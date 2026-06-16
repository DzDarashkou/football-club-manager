<!-- Button primitive aligned with shadcn-vue conventions and club semantic tokens. -->
<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { computed, useAttrs } from 'vue'
import { cn } from '@@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-secondary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-brand-700',
        outline: 'border border-border bg-surface text-foreground hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
      },
      size: {
        default: 'min-h-[44px] px-4 py-2',
        sm: 'min-h-[40px] px-3 py-2 text-label',
        lg: 'min-h-[48px] px-5 py-3',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  as?: string
  class?: string
}

const props = withDefaults(defineProps<ButtonProps>(), {
  as: 'button',
  class: undefined,
})

const attrs = useAttrs()
const classes = computed(() => cn(buttonVariants({ variant: props.variant, size: props.size }), props.class))
</script>

<template>
  <component :is="as" v-bind="attrs" :class="classes">
    <slot />
  </component>
</template>
