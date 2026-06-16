<!-- Temporary token showcase page for validating the design foundation during setup. -->
<script setup lang="ts">
import type { StatusKey } from '@@/types/design'

const brandSwatches = [
  { name: 'brand-50', className: 'bg-brand-50 text-brand-900' },
  { name: 'brand-100', className: 'bg-brand-100 text-brand-900' },
  { name: 'brand-200', className: 'bg-brand-200 text-brand-900' },
  { name: 'brand-400', className: 'bg-brand-400 text-white' },
  { name: 'brand-700', className: 'bg-brand-700 text-white' },
  { name: 'brand-800', className: 'bg-brand-800 text-white' },
  { name: 'brand-900', className: 'bg-brand-900 text-white' },
]

const statuses: StatusKey[] = ['confirmed', 'declined', 'pending', 'neutral']
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-8">
    <section class="space-y-3">
      <div>
        <p class="eyebrow text-brand-700">Design System</p>
        <h1>Token test page</h1>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card v-for="swatch in brandSwatches" :key="swatch.name" class="space-y-4">
          <div class="h-24 rounded-lg" :class="swatch.className" />
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">{{ swatch.name }}</span>
            <Badge variant="secondary">{{ swatch.name }}</Badge>
          </div>
        </Card>
      </div>
    </section>

    <section class="space-y-3">
      <h2>Status badges</h2>
      <div class="flex flex-wrap gap-3">
        <Badge v-for="status in statuses" :key="status" :status="status">
          {{ status }}
        </Badge>
      </div>
    </section>

    <section class="space-y-3">
      <h2>Typography</h2>
      <Card class="space-y-3">
        <p class="text-xs2 uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]">xs2 micro label</p>
        <p class="text-label text-[color:var(--color-text-secondary)]">label secondary metadata</p>
        <p class="text-body">body copy uses the default readable line-height for app content.</p>
        <h3>Heading three token</h3>
        <h2>Heading two token</h2>
        <h1>Heading one token</h1>
      </Card>
    </section>

    <section class="space-y-3">
      <h2>ClubLogo variants</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <Card class="space-y-4 bg-brand-800">
          <ClubLogo variant="full" />
          <ClubLogo variant="mark" />
        </Card>
        <Card class="space-y-4">
          <ClubLogo variant="full" :inverted="false" />
          <ClubLogo variant="mark" :inverted="false" />
        </Card>
      </div>
    </section>

    <section class="space-y-3">
      <h2>Buttons</h2>
      <div class="flex flex-wrap gap-3">
        <Button>Primary action</Button>
        <Button variant="outline">Outline action</Button>
        <Button variant="secondary">Secondary action</Button>
      </div>
    </section>
  </div>
</template>
