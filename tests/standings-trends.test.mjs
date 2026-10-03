import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  chronologicalSnapshots,
  teamValues,
  metricDomain,
  chartY,
} from '../utils/standings-trends.ts'

const snapshot = (id, date, teams) => ({
  id,
  imported_at: date,
  external_team_id: 'club',
  teams,
})
const team = (id, points, position) => ({ id, name: id, points, position })
test('orders imports chronologically and deduplicates overlapping pages without mutating input', () => {
  const older = snapshot('a', '2026-09-01T12:00:00Z', [])
  const newer = snapshot('b', '2026-09-02T12:00:00Z', [])
  const input = [newer, older, newer]
  assert.deepEqual(chronologicalSnapshots(input), [older, newer])
  assert.equal(input.length, 3)
})
test('uses stable team IDs, preserves official standings and leaves gaps', () => {
  const snapshots = [
    snapshot('a', '2026-09-01', [team('club', -3, 8), team('other', 5, 1)]),
    snapshot('b', '2026-09-02', [team('other', 5, 1)]),
    snapshot('c', '2026-09-03', [
      { ...team('club', 0, 6), name: 'Renamed club' },
    ]),
  ]
  assert.deepEqual(teamValues(snapshots, 'club', 'points'), [-3, null, 0])
  assert.deepEqual(teamValues(snapshots, 'club', 'position'), [8, null, 6])
})
test('scales negative points and puts first place at the top', () => {
  const points = metricDomain([-3, null, 6], 'points')
  assert.deepEqual(points, [-3, 6])
  assert.ok(chartY(6, points, 'points') < chartY(-3, points, 'points'))
  const positions = metricDomain([1, 8], 'position')
  assert.ok(chartY(1, positions, 'position') < chartY(8, positions, 'position'))
})
test('empty and single-value domains remain usable', () => {
  for (const metric of ['points', 'position']) {
    for (const values of [[], [null], [1], [0]]) {
      const domain = metricDomain(values, metric)
      assert.ok(domain[1] > domain[0])
      assert.ok(Number.isFinite(chartY(domain[0], domain, metric)))
    }
  }
})
