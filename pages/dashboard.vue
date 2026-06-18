<script setup lang="ts">
definePageMeta({
  allowedRoles: ['parent'],
})

const { profile } = useAppAuth()

const squad = [
  { initials: 'MK', name: 'Marek', className: 'avatar-chip avatar-chip-confirmed' },
  { initials: 'JN', name: 'Jan', className: 'avatar-chip avatar-chip-confirmed' },
  { initials: 'TW', name: 'Tomek', className: 'avatar-chip avatar-chip-declined' },
  { initials: 'PS', name: 'Piotr', className: 'avatar-chip avatar-chip-neutral' },
  { initials: '+5', name: 'More', className: 'avatar-chip avatar-chip-neutral' },
]

const upcoming = [
  { day: 'SAT', date: '20', title: 'Match vs WKS Slask', meta: '10:00 · Home' },
  { day: 'WED', date: '24', title: 'Training session', meta: '17:30 · Boisko nr 2' },
]
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <div class="space-y-2 pt-2">
      <p class="text-h2 text-[color:var(--color-text-secondary)]">Good afternoon</p>
      <h1>{{ profile?.full_name || profile?.email || 'Parent account' }}</h1>
    </div>

    <Card class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <p class="eyebrow text-brand-700">Next match</p>
          <h3>Sporting Wroclaw U10 vs WKS Slask</h3>
          <p class="text-label text-[color:var(--color-text-secondary)]">Sat 20 Jun · 10:00 · Stadion treningowy</p>
        </div>
        <Avatar fallback="SW" class="h-14 w-14" />
      </div>
      <Separator />
      <div class="space-y-3">
        <p class="text-body">Will Marek play?</p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button class="bg-[var(--status-confirmed-bg)] text-[var(--status-confirmed-text)] hover:opacity-90">
            Yes, he&apos;s in
          </Button>
          <Button variant="outline">Can&apos;t make it</Button>
        </div>
      </div>
    </Card>

    <section class="space-y-3">
      <h2>Squad availability</h2>
      <div class="flex gap-4 overflow-x-auto pb-2">
        <div v-for="player in squad" :key="player.initials" class="min-w-[56px] text-center">
          <div :class="player.className">{{ player.initials }}</div>
          <p class="mt-2 text-xs2 text-[color:var(--color-text-secondary)]">{{ player.name }}</p>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h2>Upcoming</h2>
      <Card class="overflow-hidden p-0">
        <div
          v-for="item in upcoming"
          :key="item.title"
          class="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
        >
          <div class="w-10 text-center">
            <p class="text-xs2 uppercase text-[color:var(--color-text-secondary)]">{{ item.day }}</p>
            <p class="text-h1">{{ item.date }}</p>
          </div>
          <div class="flex-1">
            <p class="text-h3">{{ item.title }}</p>
            <p class="text-label text-[color:var(--color-text-secondary)]">{{ item.meta }}</p>
          </div>
          <ChevronRight class="h-5 w-5 text-[color:var(--color-text-tertiary)]" />
        </div>
      </Card>
    </section>
  </div>
</template>
