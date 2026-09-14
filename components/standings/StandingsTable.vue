<script setup lang="ts">
import type { StandingsTable } from '@@/types/standings'

const props = defineProps<{ table: StandingsTable, externalTeamId?: string }>()
const rows = computed(() => [...props.table.rows].sort((a, b) => a.index - b.index))
function logoUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'cdn.laczynaspilka.pl' ? url.href : undefined
  }
  catch { return undefined }
}
</script>

<template>
  <div class="space-y-3">
    <p v-if="!rows.length" class="py-8 text-center text-sm">Ta tabela nie zawiera jeszcze drużyn.</p>
    <template v-else>
      <p class="text-sm text-muted-foreground sm:hidden">Przesuń tabelę w bok, aby zobaczyć wszystkie wyniki.</p>
      <div class="overflow-x-auto rounded-lg border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400" tabindex="0" role="region" :aria-label="`Tabela: ${table.play.name}`">
        <table class="w-full min-w-[680px] text-left text-sm tabular-nums">
          <caption class="sr-only">{{ table.play.name }} — tabela ligowa</caption>
          <thead class="bg-brand-50 text-brand-900">
            <tr>
              <th scope="col" class="p-3">Poz.</th><th scope="col" class="p-3">Drużyna</th>
              <th scope="col" class="p-3" title="Punkty">Pkt</th><th scope="col" class="p-3" title="Mecze">M</th>
              <th scope="col" class="p-3" title="Zwycięstwa">Z</th><th scope="col" class="p-3" title="Remisy">R</th>
              <th scope="col" class="p-3" title="Porażki">P</th><th scope="col" class="p-3">Bramki</th><th scope="col" class="p-3">Bilans</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="row in rows" :key="row.team.id" :class="row.team.id === externalTeamId ? 'bg-brand-50 font-medium' : 'bg-surface'">
              <td class="p-3">{{ row.index }}<span v-if="row.positionStatus === 'Upper'" aria-label="Wzrost pozycji"> ↑</span><span v-else-if="row.positionStatus === 'Lower'" aria-label="Spadek pozycji"> ↓</span></td>
              <th scope="row" class="min-w-[220px] p-3 font-medium">
                <div class="flex items-center gap-2">
                  <img v-if="logoUrl(row.team.logo)" :src="logoUrl(row.team.logo)" alt="" class="h-7 w-7 object-contain" loading="lazy" referrerpolicy="no-referrer">
                  <span>{{ row.team.name }}</span>
                </div>
                <div class="mt-1 flex flex-wrap gap-1 text-xs">
                  <span v-if="row.promotionStatus === 'Promotion'" class="rounded bg-[var(--status-confirmed-bg)] px-2 py-1 text-[var(--status-confirmed-text)]">Awans</span>
                  <span v-if="row.promotionStatus === 'Demotion'" class="rounded bg-[var(--status-declined-bg)] px-2 py-1 text-[var(--status-declined-text)]">Spadek</span>
                  <span v-if="row.isCancelled" class="rounded bg-gray-100 px-2 py-1 text-gray-700">Wycofana</span>
                </div>
              </th>
              <td class="p-3 font-medium">{{ row.stats.points }}</td><td class="p-3">{{ row.stats.matchesCount }}</td>
              <td class="p-3">{{ row.stats.winsCount }}</td><td class="p-3">{{ row.stats.drawsCount }}</td><td class="p-3">{{ row.stats.losesCount }}</td>
              <td class="whitespace-nowrap p-3">{{ row.stats.goalsCount }}:{{ row.stats.lostGoalsCount }}</td>
              <td class="p-3">{{ row.stats.balanceGoalsCount > 0 ? '+' : '' }}{{ row.stats.balanceGoalsCount }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-muted-foreground">M — mecze · Z — zwycięstwa · R — remisy · P — porażki. Kolejność według zaimportowanej tabeli.</p>
    </template>
  </div>
</template>
