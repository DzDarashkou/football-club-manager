<script setup lang="ts">
import type { StandingsTrendSnapshot } from '@@/types/standings'
import { chartY, metricDomain, teamValues } from '@@/utils/standings-trends'

const props = defineProps<{ snapshots: StandingsTrendSnapshot[], snapshotId: string }>()
const metric = 'position' as const
const activePoint = ref<{ teamId: string, snapshotId: string } | null>(null)
const tooltipId = useId()
const selected = ref<string[]>([])
const inspectedId = ref('')
const teams = computed(() => {
  const entries = new Map<string, { id: string, name: string }>()
  for (const snapshot of props.snapshots) for (const team of snapshot.teams) entries.set(team.id, team)
  return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name, 'pl'))
})
watch(() => props.snapshots.at(-1)?.external_team_id, id => { if (id) selected.value = [id] }, { immediate: true })
const colors = ['#185FA5', '#A33A20', '#38751D', '#7B3FA0', '#946000', '#007D80', '#C12F78', '#5254A3', '#596B20', '#914D69', '#247FBB', '#665044']
const teamColors = reactive(new Map<string, string>())
watch(teams, entries => {
  for (const team of entries) {
    if (teamColors.has(team.id)) continue
    const index = teamColors.size
    // Allocate once per team; expand the palette instead of cycling through it.
    teamColors.set(team.id, colors[index] ?? `hsl(${((index - colors.length) * 137.508) % 360} 65% 36%)`)
  }
}, { immediate: true, flush: 'sync' })
function color(id: string): string | undefined {
  return teamColors.get(id)
}
const series = computed(() => teams.value.filter(team => selected.value.includes(team.id)).map(team => ({
  ...team, values: teamValues(props.snapshots, team.id, metric), color: color(team.id),
})))
const domain = computed(() => metricDomain(series.value.flatMap(team => team.values), metric))
const ticks = computed(() => [...new Set(Array.from({ length: 5 }, (_, index) => Math.round(domain.value[0] + (domain.value[1] - domain.value[0]) * index / 4)))])
function x(index: number): number {
  const first = Date.parse(props.snapshots[0]?.imported_at ?? '')
  const last = Date.parse(props.snapshots.at(-1)?.imported_at ?? '')
  const current = Date.parse(props.snapshots[index]?.imported_at ?? '')
  return last > first ? 52 + (current - first) / (last - first) * 640 : 372
}
function paths(values: Array<number | null>): string {
  let connected = false
  return values.map((value, index) => {
    if (value === null) { connected = false; return '' }
    const command = connected ? 'L' : 'M'
    connected = true
    return `${command}${x(index)},${chartY(value, domain.value, metric)}`
  }).join(' ')
}
function date(value: string, full = false): string {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: full ? 'medium' : 'short', ...(full ? { timeStyle: 'medium' as const } : {}), timeZone: 'Europe/Warsaw' }).format(new Date(value))
}
const inspected = computed(() => props.snapshots.find(snapshot => snapshot.id === inspectedId.value) ?? props.snapshots.at(-1))
const markerIndex = computed(() => props.snapshots.findIndex(snapshot => snapshot.id === (props.snapshotId || props.snapshots.at(-1)?.id)))
const tooltip = computed(() => {
  if (!activePoint.value || !selected.value.includes(activePoint.value.teamId)) return null
  const index = props.snapshots.findIndex(snapshot => snapshot.id === activePoint.value?.snapshotId)
  const snapshot = props.snapshots[index]
  const team = snapshot?.teams.find(entry => entry.id === activePoint.value?.teamId)
  if (!team) return null
  const y = chartY(team.position, domain.value, metric)
  return { points: team.points, x: Math.min(584, Math.max(52, x(index) - 54)), y: y < 70 ? y + 18 : y - 46 }
})
function showPoint(teamId: string, index: number): void {
  const snapshot = props.snapshots[index]
  if (snapshot) activePoint.value = { teamId, snapshotId: snapshot.id }
}
function pointLabel(teamId: string, index: number): string {
  const snapshot = props.snapshots[index]
  const team = snapshot?.teams.find(entry => entry.id === teamId)
  return snapshot && team ? `${team.name}: miejsce ${team.position}, punkty: ${team.points} — ${date(snapshot.imported_at, true)}` : ''
}
</script>

<template>
  <p v-if="!snapshots.length" class="text-sm">Brak historii. Wykres pojawi się po pierwszym imporcie.</p>
  <div v-else class="min-w-0 space-y-4">
    <fieldset class="max-h-48 overflow-y-auto rounded-lg border border-border p-2">
      <legend class="px-1 text-sm">Drużyny do porównania</legend>
      <div class="flex flex-wrap gap-x-4">
        <label v-for="team in teams" :key="team.id" class="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
          <input v-model="selected" type="checkbox" :value="team.id" class="h-5 w-5 accent-brand-700">
          <svg width="20" height="8" aria-hidden="true"><path d="M0 4H20" :stroke="color(team.id)" stroke-width="3" /></svg>
          {{ team.name }}
        </label>
      </div>
    </fieldset>
    <p v-if="snapshots.length === 1" role="status" class="text-sm">Dostępny jest jeden import. Kolejne importy pokażą zmiany.</p>
    <p v-if="!series.length" role="status" class="text-sm">Wybierz przynajmniej jedną drużynę.</p>
    <template v-else>
      <p class="text-sm">Pozycja — pierwsze miejsce u góry</p>
      <div class="overflow-x-auto rounded-lg border border-border focus-visible:ring-2 focus-visible:ring-brand-400" tabindex="0" role="region" aria-label="Wykres historii — przewijaj poziomo na małym ekranie">
        <svg viewBox="0 0 720 300" class="w-full min-w-[560px]" role="group" aria-label="Pozycje drużyn według dat importu. Wybierz punkt, aby zobaczyć liczbę punktów." @mouseleave="activePoint = null" @keydown.esc="activePoint = null">
          <g v-for="tick in ticks" :key="tick">
            <line x1="52" x2="692" :y1="chartY(tick, domain, metric)" :y2="chartY(tick, domain, metric)" stroke="currentColor" class="text-border" />
            <text x="44" :y="chartY(tick, domain, metric) + 4" text-anchor="end" fill="currentColor" font-size="12">{{ tick }}</text>
          </g>
          <line v-if="markerIndex >= 0" :x1="x(markerIndex)" :x2="x(markerIndex)" y1="20" y2="260" stroke="currentColor" stroke-dasharray="4 4" class="text-muted-foreground" />
          <g v-for="team in series" :key="team.id">
            <path :d="paths(team.values)" fill="none" :stroke="team.color" stroke-width="2" />
            <template v-for="(value, index) in team.values" :key="index">
              <g v-if="value !== null">
                <circle :cx="x(index)" :cy="chartY(value, domain, metric)" r="4" :fill="team.color" aria-hidden="true" />
                <circle :cx="x(index)" :cy="chartY(value, domain, metric)" r="16" fill="transparent"
                  tabindex="0" role="button" :aria-label="pointLabel(team.id, index)"
                  :aria-describedby="activePoint?.teamId === team.id && activePoint?.snapshotId === snapshots[index]?.id ? tooltipId : undefined"
                  class="cursor-pointer focus-visible:stroke-brand-700 focus-visible:outline-none" stroke-width="2"
                  @mouseenter="showPoint(team.id, index)" @focus="showPoint(team.id, index)" @blur="activePoint = null"
                  @click="showPoint(team.id, index)" @keydown.enter.prevent="showPoint(team.id, index)" @keydown.space.prevent="showPoint(team.id, index)" />
              </g>
            </template>
          </g>
          <g v-if="tooltip" :id="tooltipId" role="tooltip" :transform="`translate(${tooltip.x}, ${tooltip.y})`">
            <rect width="108" height="32" rx="6" class="fill-brand-900" />
            <text x="54" y="21" text-anchor="middle" class="fill-white" font-size="13">Punkty: {{ tooltip.points }}</text>
          </g>
          <text x="52" y="286" fill="currentColor" font-size="12">{{ date(snapshots[0]!.imported_at) }}</text>
          <text x="692" y="286" text-anchor="end" fill="currentColor" font-size="12">{{ date(snapshots[snapshots.length - 1]!.imported_at) }}</text>
        </svg>
      </div>
      <p class="text-xs text-muted-foreground">Oś pozioma: data importu. Najedź na punkt lub wybierz go, aby zobaczyć liczbę punktów. Przerywana linia oznacza wybraną wersję tabeli. Brak drużyny w imporcie przerywa linię.</p>
      <p v-if="snapshotId && markerIndex < 0" class="text-sm">Wybrana wersja jest poza wczytaną historią. Wczytaj starsze importy, aby ją zaznaczyć.</p>
      <label class="block space-y-2 text-sm">
        <span>Szczegóły importu — punkty i pozycje</span>
        <select :value="inspected?.id" class="min-h-11 w-full rounded-lg border border-input bg-surface px-3 focus-visible:ring-2 focus-visible:ring-brand-400" @change="inspectedId = ($event.target as HTMLSelectElement).value">
          <option v-for="snapshot in snapshots" :key="snapshot.id" :value="snapshot.id">{{ date(snapshot.imported_at, true) }}</option>
        </select>
      </label>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm tabular-nums">
          <caption class="sr-only">Wartości wybranych drużyn dla {{ inspected ? date(inspected.imported_at, true) : '' }}</caption>
          <thead><tr><th scope="col" class="p-2">Drużyna</th><th scope="col" class="p-2">Punkty</th><th scope="col" class="p-2">Pozycja</th></tr></thead>
          <tbody><tr v-for="team in series" :key="team.id" class="border-t border-border">
            <th scope="row" class="p-2 font-medium">{{ team.name }}</th>
            <td class="p-2">{{ inspected?.teams.find(entry => entry.id === team.id)?.points ?? 'Brak danych' }}</td>
            <td class="p-2">{{ inspected?.teams.find(entry => entry.id === team.id)?.position ?? 'Brak danych' }}</td>
          </tr></tbody>
        </table>
      </div>
    </template>
  </div>
</template>
