<script setup lang="ts">
import StandingsTrendChart from './StandingsTrendChart.vue'
import type { StandingsTrends } from '@@/types/standings'
import { chronologicalSnapshots } from '@@/utils/standings-trends'

const props = defineProps<{ groupId: string, snapshotId: string }>()
const requestFetch = useRequestFetch()
const { data, pending, error, refresh } = await useAsyncData(
  `standings-trends:${props.groupId}`,
  () => requestFetch<StandingsTrends>('/api/standings/trends', { query: { group_id: props.groupId } }),
)
const older = ref<StandingsTrends['snapshots']>([])
const page = ref(0)
const olderHasMore = ref(false)
const loadingOlder = ref(false)
const olderError = ref(false)
const snapshots = computed(() => chronologicalSnapshots([...(data.value?.snapshots ?? []), ...older.value]))
const hasMore = computed(() => page.value ? olderHasMore.value : data.value?.hasMore)
async function loadOlder(): Promise<void> {
  if (loadingOlder.value) return
  loadingOlder.value = true
  olderError.value = false
  try {
    const result = await requestFetch<StandingsTrends>('/api/standings/trends', { query: { group_id: props.groupId, page: page.value + 1 } })
    older.value.push(...result.snapshots)
    olderHasMore.value = result.hasMore
    page.value++
  }
  catch { olderError.value = true }
  finally { loadingOlder.value = false }
}
</script>

<template>
  <Card class="min-w-0 space-y-4 p-4">
    <h2>Historia punktów i pozycji</h2>
    <p class="text-sm text-muted-foreground">Zmiany według dat importu tabel, nie kolejek meczowych. Linie łączą zapisane wyniki.</p>
    <p v-if="pending" role="status">Ładowanie wykresu…</p>
    <div v-else-if="error" role="alert"><p>Nie udało się pobrać wykresu.</p><Button variant="outline" @click="refresh()">Spróbuj ponownie</Button></div>
    <template v-else>
      <StandingsTrendChart :snapshots="snapshots" :snapshot-id="snapshotId" />
      <p v-if="olderError" role="alert">Nie udało się pobrać starszej historii. Spróbuj ponownie.</p>
      <Button v-if="hasMore" variant="outline" :disabled="loadingOlder" @click="loadOlder">{{ loadingOlder ? 'Ładowanie…' : 'Wczytaj starszą historię' }}</Button>
    </template>
  </Card>
</template>
