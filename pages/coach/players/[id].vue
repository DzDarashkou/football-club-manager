<script setup lang="ts">
import { UserRound } from 'lucide-vue-next'
import type { AdminPlayer } from '@@/types/admin-club'

definePageMeta({ allowedRoles: ['admin', 'coach'] })

const playerId = useRoute().params.id as string
const { data, pending, error } = await useFetch<{ player: AdminPlayer }>(`/api/coach/players/${playerId}`)
function formatDate(value: string) { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`)) }
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6"><NuxtLink to="/coach/players" class="text-sm text-brand-700">← Players</NuxtLink><div v-if="pending">Loading player...</div><p v-else-if="error" class="rounded-lg border border-[color:var(--status-declined-ring)] bg-[var(--status-declined-bg)] p-4 text-sm text-[var(--status-declined-text)]">{{ error.statusMessage || 'Unable to load player.' }}</p><template v-else-if="data"><div class="flex items-center gap-4"><div class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700"><UserRound class="h-8 w-8" /></div><div><h1>{{ data.player.full_name }}{{ data.player.shirt_number ? ` · #${data.player.shirt_number}` : '' }}</h1><p class="text-body text-[color:var(--color-text-secondary)]">{{ data.player.team.name }} · {{ data.player.team.age_group.name }}</p></div></div><Card class="grid gap-4 sm:grid-cols-3"><div><p class="text-label text-[color:var(--color-text-secondary)]">Date of birth</p><p>{{ formatDate(data.player.date_of_birth) }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Shirt number</p><p>{{ data.player.shirt_number ? `#${data.player.shirt_number}` : 'Not set' }}</p></div><div><p class="text-label text-[color:var(--color-text-secondary)]">Status</p><Badge :status="data.player.is_active ? 'confirmed' : 'neutral'">{{ data.player.is_active ? 'Active' : 'Inactive' }}</Badge></div></Card></template></div>
</template>
