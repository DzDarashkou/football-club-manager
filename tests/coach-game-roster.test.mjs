import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { ref } from 'vue'
import ts from 'typescript'

const source = readFileSync(new URL('../composables/useCoachGameRoster.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
})

function createRoster(canManageGame, fetchRoster) {
  const exports = {}
  runInNewContext(outputText, {
    exports,
    require: createRequire(import.meta.url),
    useRequestFetch: () => fetchRoster,
    // Simulate Nuxt retaining the handler for global refresh, even if initial
    // execution was disabled. The real composable supplies the role guard.
    useAsyncData: (key, handler, options) => ({ key, refresh: handler, options }),
  })
  return exports.useCoachGameRoster('game-id', canManageGame)
}

test('parent tab resume never calls the coach-only roster endpoint', async () => {
  let requests = 0
  const roster = createRoster(ref(false), async () => {
    requests += 1
    throw new Error('403: You do not have access to this action.')
  })
  assert.equal(roster.options.immediate, false)
  for (let resume = 0; resume < 2; resume += 1) {
    assert.equal((await roster.refresh()).players.length, 0)
  }
  assert.equal(requests, 0)
})

test('coach refresh loads the roster and rechecks permissions after a role change', async () => {
  const canManage = ref(true)
  const urls = []
  const payload = { players: [{ player_id: 'player-id' }] }
  const roster = createRoster(canManage, async (url) => {
    urls.push(url)
    return payload
  })
  assert.equal(roster.options.immediate, true)
  assert.equal(await roster.refresh(), payload)
  assert.deepEqual(urls, ['/api/coach/games/game-id/players'])
  canManage.value = false
  assert.equal((await roster.refresh()).players.length, 0)
  assert.equal(urls.length, 1)
})

test('genuine server permission errors remain visible to authorized-role users', async () => {
  const error = new Error('You are not assigned to this team.')
  const roster = createRoster(ref(true), async () => { throw error })
  await assert.rejects(roster.refresh(), error)
})
