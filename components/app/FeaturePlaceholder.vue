<script setup lang="ts">
type FeaturePlaceholderItem = {
  label: string
  value: string
}

type FeaturePlaceholderProps = {
  eyebrow: string
  title: string
  description: string
  items?: FeaturePlaceholderItem[]
}

const props = withDefaults(defineProps<FeaturePlaceholderProps>(), {
  items: () => [],
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="space-y-2 pt-2">
      <p class="eyebrow text-brand-700">{{ props.eyebrow }}</p>
      <h1>{{ props.title }}</h1>
      <p class="text-body text-[color:var(--color-text-secondary)]">
        {{ props.description }}
      </p>
    </div>

    <Card class="space-y-4">
      <p class="text-h3">What&apos;s ready in this phase</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="item in props.items"
          :key="item.label"
          class="rounded-xl border border-border bg-[var(--color-surface-subtle)] p-4"
        >
          <p class="text-label text-[color:var(--color-text-secondary)]">{{ item.label }}</p>
          <p class="mt-1 text-h3">{{ item.value }}</p>
        </div>
      </div>
    </Card>
  </div>
</template>
