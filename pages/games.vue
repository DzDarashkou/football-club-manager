<script setup lang="ts">
import { ref } from 'vue'
import { useAppAuth } from '@@/composables/useAppAuth'
definePageMeta({ allowedRoles: ['parent', 'coach'] })
const { role } = useAppAuth(); const savingId = ref<string | null>(null)
const { data, refresh } = await useFetch<{ games: Array<{ game_id: string, player_id: string, availability_status: string, player: { full_name: string }, game: { opponent_name: string, scheduled_at: string, location_type: string } }> }>('/api/parent/games', { default: () => ({ games: [] }) })
async function respond(item: { game_id: string, player_id: string }, status: 'available' | 'unavailable') { savingId.value = `${item.game_id}-${item.player_id}`; try { await $fetch(`/api/parent/games/${item.game_id}/players/${item.player_id}/attendance`, { method: 'PATCH', body: { availability_status: status } }); await refresh() } finally { savingId.value = null } }
function format(value: string) { return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
</script>
<template>
  <div v-if="role === 'coach'" class="mx-auto max-w-3xl space-y-4"><h1>Games</h1><p class="text-body text-[color:var(--color-text-secondary)]">Use the coach workflow to select players and manage attendance.</p><Button as="NuxtLink" to="/coach/games">Open coach games</Button></div>
  <div v-else class="mx-auto max-w-3xl space-y-6"><div><h1>Games</h1><p class="text-body text-[color:var(--color-text-secondary)]">Confirm whether your child can attend each selected game.</p></div><Card v-if="!data?.games.length" class="text-center text-sm text-[color:var(--color-text-secondary)]">No game invitations are waiting for a response.</Card><Card v-for="item in data?.games" :key="`${item.game_id}-${item.player_id}`" class="space-y-3"><div><h2>{{ item.game.opponent_name }}</h2><p class="text-sm text-[color:var(--color-text-secondary)]">{{ item.player.full_name }} · {{ format(item.game.scheduled_at) }} · {{ item.game.location_type }}</p></div><Badge :status="item.availability_status === 'available' ? 'confirmed' : item.availability_status === 'unavailable' ? 'declined' : 'pending'">{{ item.availability_status }}</Badge><div class="flex gap-3"><Button :disabled="Boolean(savingId)" @click="respond(item, 'available')">Available</Button><Button variant="outline" :disabled="Boolean(savingId)" @click="respond(item, 'unavailable')">Unavailable</Button></div></Card></div>
</template>
