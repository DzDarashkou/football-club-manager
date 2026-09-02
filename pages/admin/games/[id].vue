<script setup lang="ts">
import { computed, ref } from 'vue'
import { Trash2 } from 'lucide-vue-next'
import type { AdminGame, GamePlayer } from '@@/types/admin-club'
definePageMeta({ allowedRoles: ['admin'] })
const id = useRoute().params.id as string
const { data, pending, error: loadError, refresh } = useFetch<{ game: AdminGame, players: GamePlayer[] }>(`/api/admin/games/${id}`, {
  lazy: true,
  timeout: 10_000,
})
const selectedIds = ref<string[]>([]); const adding = ref(false); const deleting = ref(false); const error = ref<string | null>(null)
const { data: eligibleData } = useFetch<{ players: Array<{ id: string, full_name: string, shirt_number: number | null }> }>(`/api/admin/games/${id}/eligible-players`, {
  default: () => ({ players: [] }),
  lazy: true,
  timeout: 10_000,
})
const selectedPlayerIds = computed(() => new Set(data.value?.players.map(player => player.player_id) ?? []))
async function addPlayers() { adding.value = true; error.value = null; try { await $fetch(`/api/admin/games/${id}/players`, { method: 'POST', body: { player_ids: selectedIds.value } }); selectedIds.value = []; await refresh() } catch (value) { error.value = 'Nie udało się dodać zawodników.' } finally { adding.value = false } }
async function deleteGame() { if (!window.confirm('Usunąć ten mecz? Kadra i zapisy obecności również zostaną usunięte.')) return; deleting.value = true; try { await $fetch(`/api/admin/games/${id}`, { method: 'DELETE' } as never); await navigateTo('/admin/games') } catch (value) { error.value = 'Nie udało się usunąć meczu.'; deleting.value = false } }
function format(value: string) { return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
</script>
<template><div class="mx-auto max-w-4xl space-y-6"><NuxtLink to="/admin/games" class="text-sm text-brand-700">← Mecze</NuxtLink><div v-if="pending">Wczytywanie meczu...</div><p v-else-if="loadError || !data" class="rounded-lg bg-[var(--status-declined-bg)] p-4 text-sm">{{ loadError?.data?.statusMessage || 'Nie udało się wczytać meczu. Wróć do listy meczów i spróbuj ponownie.' }}</p><template v-else><div class="flex flex-wrap items-start justify-between gap-3"><div><h1>{{ data.game.team.name }} – {{ data.game.opponent_name }}</h1><p class="text-body text-[color:var(--color-text-secondary)]">{{ format(data.game.scheduled_at) }} · {{ data.game.season.name }}</p></div><Button variant="destructive" class="gap-2" :disabled="deleting" @click="deleteGame"><Trash2 class="h-4 w-4" />{{ deleting ? 'Usuwanie...' : 'Usuń mecz' }}</Button></div><div v-if="error" class="rounded-lg bg-[var(--status-declined-bg)] p-3 text-sm">{{ error }}</div><Card class="space-y-2"><p>Miejsce: {{ data.game.venue?.name || 'Do potwierdzenia' }}</p><p>Status: {{ data.game.status }}</p><p v-if="data.game.status === 'completed'" class="text-h2">{{ data.game.home_score }}–{{ data.game.away_score }}</p></Card><Card class="space-y-3"><h2>Dodaj zawodników</h2><div class="grid gap-2 sm:grid-cols-2"><label v-for="player in eligibleData?.players.filter(item => !selectedPlayerIds.has(item.id))" :key="player.id" class="flex min-h-[44px] items-center gap-3 rounded-lg border border-border px-3"><input v-model="selectedIds" type="checkbox" :value="player.id">{{ player.full_name }}</label></div><Button :disabled="adding || !selectedIds.length" @click="addPlayers">{{ adding ? 'Dodawanie...' : 'Dodaj wybranych zawodników' }}</Button></Card><Card class="overflow-hidden p-0"><div class="border-b border-border p-4"><h2>Dostępność kadry</h2></div><p v-if="!data.players.length" class="p-6 text-center text-sm">Do tego meczu nie dodano jeszcze zawodników.</p><NuxtLink v-for="player in data.players" :key="player.player_id" :to="`/admin/players/${player.player_id}`" class="flex justify-between border-b border-border p-4"><span>{{ player.player.full_name }}</span><Badge :status="player.availability_status === 'available' ? 'confirmed' : player.availability_status === 'unavailable' ? 'declined' : 'pending'">{{ player.availability_status }}</Badge></NuxtLink></Card></template></div></template>
