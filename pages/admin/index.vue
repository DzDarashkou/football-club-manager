<script setup lang="ts">
definePageMeta({
  allowedRoles: ['admin'],
})

const metrics = [
  { label: 'Teams', value: '6' },
  { label: 'Players', value: '94' },
  { label: 'Coaches', value: '8' },
  { label: 'Games this week', value: '5' },
]

const teams = [
  { name: 'U10 Sporting', players: '16 players', coach: 'Coach: T. Lewandowski' },
  { name: 'U12 Sporting', players: '18 players', coach: 'Coach: M. Zielinski' },
  { name: 'U14 Sporting', players: '17 players', coach: 'Coach: P. Wojcik' },
]
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <div class="space-y-2">
      <h1>Club overview</h1>
      <p class="text-body text-[color:var(--color-text-secondary)]">Sezon 2025/2026</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card v-for="metric in metrics" :key="metric.label" class="space-y-3">
        <p class="text-h2 text-[color:var(--color-text-secondary)]">{{ metric.label }}</p>
        <p class="text-[40px] font-medium leading-none text-[color:var(--color-text-primary)]">{{ metric.value }}</p>
      </Card>
    </div>

    <section class="space-y-4">
      <h2>Teams</h2>
      <Card class="overflow-hidden p-0">
        <div
          v-for="team in teams"
          :key="team.name"
          class="grid gap-3 border-b border-border px-4 py-5 last:border-b-0 md:grid-cols-[auto_1fr_auto_auto_auto] md:items-center"
        >
          <Avatar fallback="SW" class="h-14 w-14" />
          <p class="text-h2">{{ team.name }}</p>
          <p class="text-body text-[color:var(--color-text-secondary)]">{{ team.players }}</p>
          <p class="text-body text-[color:var(--color-text-secondary)]">{{ team.coach }}</p>
          <ShieldAlert class="h-5 w-5 text-[color:var(--color-text-tertiary)]" />
        </div>
      </Card>
    </section>
  </div>
</template>
