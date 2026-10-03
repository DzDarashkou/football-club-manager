import type { StandingsTrendSnapshot } from '../types/standings'

export type TrendMetric = 'points' | 'position'
export function chronologicalSnapshots(
  snapshots: StandingsTrendSnapshot[],
): StandingsTrendSnapshot[] {
  return [
    ...new Map(snapshots.map((snapshot) => [snapshot.id, snapshot])).values(),
  ].sort(
    (a, b) =>
      Date.parse(a.imported_at) - Date.parse(b.imported_at) ||
      a.id.localeCompare(b.id),
  )
}
export function teamValues(
  snapshots: StandingsTrendSnapshot[],
  teamId: string,
  metric: TrendMetric,
): Array<number | null> {
  return snapshots.map(
    (snapshot) =>
      snapshot.teams.find((team) => team.id === teamId)?.[metric] ?? null,
  )
}
export function metricDomain(
  values: Array<number | null>,
  metric: TrendMetric,
): [number, number] {
  const present = values.filter((value): value is number => value !== null)
  return metric === 'position'
    ? [1, Math.max(2, ...present)]
    : [Math.min(0, ...present), Math.max(1, ...present)]
}
export function chartY(
  value: number,
  domain: [number, number],
  metric: TrendMetric,
): number {
  const fraction = (value - domain[0]) / (domain[1] - domain[0])
  return 24 + (metric === 'position' ? fraction : 1 - fraction) * 232
}
