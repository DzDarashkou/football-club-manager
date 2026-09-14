import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseStandingsJson, standingsImportSchema, standingsGroupSchema } from '../validators/standings.ts'

const playId = '6b323b16-45f4-4f75-b3dd-d9b04b5c373c'
const teamId = '1c5cff35-be61-4dc1-be13-74b4b5d3e645'
const groupId = '9d41a9e1-aa66-4e2c-9f33-6f4b01139837'
function table() {
  return {
    league: { id: groupId, name: 'D2' },
    play: { id: playId, name: 'Wrocław: III liga okręgowa D2 Młodzik', zpn: { id: 'c38a66b8-8d8e-49b9-8772-948c097d885a', name: 'ZPN DOLNOŚLĄSKI' } },
    rows: [{
      index: 4, positionStatus: 'None', promotionStatus: 'None', isCancelled: false,
      team: { id: teamId, name: 'SPORTING WROCŁAW', logo: null, abbreviation: 'SPO' },
      stats: { points: 3, matchesCount: 3, winsCount: 1, drawsCount: 0, losesCount: 2, goalsCount: 22, lostGoalsCount: 7, balanceGoalsCount: 15 },
    }],
  }
}

test('imports the source shape and preserves official positions, including points deductions', () => {
  const input = table()
  input.rows[0].stats.points = -3
  input.rows[0].stats.balanceGoalsCount = -15
  assert.deepEqual(parseStandingsJson(JSON.stringify(input)), input)
  assert.equal(standingsImportSchema.safeParse({ group_id: groupId, external_team_id: teamId, table: input }).success, true)
})

test('rejects malformed, oversized and unrelated JSON', () => {
  for (const json of ['{', 'null', '[]', '{}', 'x'.repeat(500001)]) assert.throws(() => parseStandingsJson(json))
})

test('rejects invalid statistics, IDs, repeated teams and repeated positions', () => {
  const invalidStats = table()
  invalidStats.rows[0].stats.matchesCount = -1
  assert.throws(() => parseStandingsJson(JSON.stringify(invalidStats)))
  const invalidId = table()
  invalidId.play.id = 'not-a-uuid'
  assert.throws(() => parseStandingsJson(JSON.stringify(invalidId)))
  const duplicateTeam = table()
  duplicateTeam.rows.push({ ...duplicateTeam.rows[0], index: 5 })
  assert.throws(() => parseStandingsJson(JSON.stringify(duplicateTeam)))
  const duplicatePosition = table()
  duplicatePosition.rows.push({ ...duplicatePosition.rows[0], team: { ...duplicatePosition.rows[0].team, id: groupId } })
  assert.throws(() => parseStandingsJson(JSON.stringify(duplicatePosition)))
})

test('requires the highlighted club team to exist in the imported table', () => {
  assert.equal(standingsImportSchema.safeParse({ group_id: groupId, external_team_id: groupId, table: table() }).success, false)
})

test('group creation requires an explicit team, season and nonempty name', () => {
  assert.equal(standingsGroupSchema.safeParse({ team_id: teamId, season_id: playId, name: 'Grupa 1' }).success, true)
  assert.equal(standingsGroupSchema.safeParse({ team_id: teamId, name: 'Grupa 1' }).success, false)
  assert.equal(standingsGroupSchema.safeParse({ team_id: teamId, season_id: playId, name: '   ' }).success, false)
})
