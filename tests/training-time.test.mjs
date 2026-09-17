import assert from 'node:assert/strict'
import { test } from 'node:test'
import { trainingDateToIso, warsawDateTime } from '../shared/utils/training-time.ts'

test('training dates use Polish winter and summer time, including month boundaries', () => {
  assert.equal(trainingDateToIso('2026-01-01T00:30'), '2025-12-31T23:30:00.000Z')
  assert.equal(trainingDateToIso('2026-07-01T00:30'), '2026-06-30T22:30:00.000Z')
  assert.equal(warsawDateTime('2026-06-30T22:30:00Z'), '2026-07-01T00:30')
})

test('rejects nonexistent dates and times during the spring DST transition', () => {
  for (const value of ['', 'not a date', '2026-02-30T17:00', '2026-03-29T02:30', '2026-09-17T25:00']) {
    assert.equal(trainingDateToIso(value), null, value)
  }
  assert.equal(trainingDateToIso('2026-03-29T03:30'), '2026-03-29T01:30:00.000Z')
})

test('autumn repeated hour resolves consistently and round-trips', () => {
  const value = '2026-10-25T02:30'
  assert.equal(trainingDateToIso(value), '2026-10-25T00:30:00.000Z')
  assert.equal(warsawDateTime(trainingDateToIso(value)), value)
})
