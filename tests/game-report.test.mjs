import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(
  new URL('../lib/game-report.ts', import.meta.url),
  'utf8',
)
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
})

const exports = {}
runInNewContext(outputText, {
  exports,
  require: createRequire(import.meta.url),
  URL,
})

const {
  computeRunningScores,
  groupLineupStarters,
  eventDisplayName,
  summarizePlayerEventStats,
  generateMatchSummaryDraft,
  toPdfDownloadUrl,
} = exports

test('computeRunningScores sorts chronologically and computes home/away running scores', () => {
  const result = computeRunningScores(
    [
      { half: 2, minute: 66, event_type: 'goal', is_our_team: true },
      { half: 1, minute: 24, event_type: 'goal', is_our_team: true },
      { half: 1, minute: 4, event_type: 'goal', is_our_team: true },
      { half: 1, minute: 30, event_type: 'yellow_card', is_our_team: false },
      { half: 2, minute: 70, event_type: 'own_goal', is_our_team: true },
    ],
    'home',
  )

  assert.equal(result.homeScore, 3)
  assert.equal(result.awayScore, 1)
  assert.equal(result.halftimeHomeScore, 2)
  assert.equal(result.halftimeAwayScore, 0)
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        result.events.map((e) => [
          e.half,
          e.minute,
          e.home_score_after,
          e.away_score_after,
        ]),
      ),
    ),
    [
      [1, 4, 1, 0],
      [1, 24, 2, 0],
      [1, 30, null, null],
      [2, 66, 3, 0],
      [2, 70, 3, 1],
    ],
  )
})

test('computeRunningScores maps our team to away score for away games', () => {
  const result = computeRunningScores(
    [
      { half: 1, minute: 10, event_type: 'goal', is_our_team: true },
      { half: 2, minute: 50, event_type: 'penalty_goal', is_our_team: false },
    ],
    'away',
  )

  assert.equal(result.homeScore, 1)
  assert.equal(result.awayScore, 1)
  assert.equal(result.events[0].home_score_after, 0)
  assert.equal(result.events[0].away_score_after, 1)
})

test('groupLineupStarters groups starters by tactical line and omits empty lines', () => {
  const groups = groupLineupStarters([
    {
      selection_status: 'started',
      lineup_line: 'offense',
      player: { id: '3', full_name: 'Jan Wawrzyniak' },
    },
    {
      selection_status: 'started',
      lineup_line: 'goalkeeper',
      player: { id: '1', full_name: 'Kacper Młyńczak' },
    },
    {
      selection_status: 'substitute',
      lineup_line: 'defense',
      player: { id: '2', full_name: 'Jan Dawiec' },
    },
  ])

  assert.equal(groups.length, 2)
  assert.equal(groups[0].label, 'Bramka')
  assert.equal(groups[1].label, 'Ofensywa')
})

test('eventDisplayName resolves player name, override, or team fallback', () => {
  assert.equal(
    eventDisplayName(
      {
        player: { id: '1', full_name: 'Nikodem Styczyński' },
        player_name_override: null,
        is_our_team: true,
      },
      'Rywal',
    ),
    'Nikodem Styczyński',
  )
  assert.equal(
    eventDisplayName(
      {
        player: null,
        player_name_override: 'Zawodnik Rywala',
        is_our_team: false,
      },
      'Rywal',
    ),
    'Zawodnik Rywala',
  )
  assert.equal(
    eventDisplayName(
      {
        player: null,
        player_name_override: null,
        is_our_team: false,
      },
      'Sporting Wrocław III',
    ),
    'Sporting Wrocław III',
  )
})

test('summarizePlayerEventStats tallies goals, assists, and cards for our team', () => {
  const stats = summarizePlayerEventStats([
    {
      event_type: 'goal',
      is_our_team: true,
      player_id: 'p1',
      assist_player_id: 'p2',
    },
    {
      event_type: 'penalty_goal',
      is_our_team: true,
      player_id: 'p1',
      assist_player_id: null,
    },
    {
      event_type: 'own_goal',
      is_our_team: true,
      player_id: 'p2',
      assist_player_id: null,
    },
    {
      event_type: 'yellow_card',
      is_our_team: true,
      player_id: 'p2',
      assist_player_id: null,
    },
    {
      event_type: 'goal',
      is_our_team: false,
      player_id: 'opp1',
      assist_player_id: null,
    },
  ])

  assert.deepEqual(JSON.parse(JSON.stringify(stats.get('p1'))), {
    goals: 2,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
  })
  assert.deepEqual(JSON.parse(JSON.stringify(stats.get('p2'))), {
    goals: 0,
    assists: 1,
    yellow_cards: 1,
    red_cards: 0,
  })
  assert.equal(stats.get('opp1'), undefined)
})

test('generateMatchSummaryDraft highlights hat-tricks and clean sheets', () => {
  const draft = generateMatchSummaryDraft(
    {
      team: { id: 't1', name: 'Sporting Wrocław II' },
      opponent_name: 'Sporting Wrocław III',
      location_type: 'home',
      home_score: 4,
      away_score: 0,
    },
    [
      {
        event_type: 'goal',
        is_our_team: true,
        player: { id: 'p1', full_name: 'Jan Dawiec' },
        player_name_override: null,
      },
      {
        event_type: 'goal',
        is_our_team: true,
        player: { id: 'p1', full_name: 'Jan Dawiec' },
        player_name_override: null,
      },
      {
        event_type: 'goal',
        is_our_team: true,
        player: { id: 'p1', full_name: 'Jan Dawiec' },
        player_name_override: null,
      },
    ],
  )

  assert.match(draft, /Pewna wygrana Sporting Wrocław II/)
  assert.match(draft, /Jan Dawiec zdobył hat-tricka/)
  assert.match(draft, /czyste konto/)
})

test('toPdfDownloadUrl converts Google Drive share links into direct download URLs', () => {
  assert.equal(
    toPdfDownloadUrl(
      'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view?usp=sharing',
    ),
    'https://drive.google.com/uc?export=download&id=1AbCdEfGhIjKlMnOpQrStUvWxYz',
  )
  assert.equal(
    toPdfDownloadUrl(
      'https://drive.google.com/open?id=1AbCdEfGhIjKlMnOpQrStUvWxYz',
    ),
    'https://drive.google.com/uc?export=download&id=1AbCdEfGhIjKlMnOpQrStUvWxYz',
  )
  assert.equal(
    toPdfDownloadUrl('https://example.com/raport-meczu.pdf'),
    'https://example.com/raport-meczu.pdf',
  )
  assert.equal(toPdfDownloadUrl('javascript:alert(1)'), null)
  assert.equal(toPdfDownloadUrl(null), null)
})
