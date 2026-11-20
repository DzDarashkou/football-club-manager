import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = readFileSync(
  new URL('../lib/game-report-parser.ts', import.meta.url),
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
})

const { parseMatchReportText } = exports

const samplePlayers = [
  { id: 'p1', full_name: 'Kacper Młyńczak' },
  { id: 'p2', full_name: 'Kacper Styczyński' },
  { id: 'p3', full_name: 'Ludwik Niemiec' },
  { id: 'p4', full_name: 'Dziyana Darashkova' },
  { id: 'p5', full_name: 'Jan Wawrzyniak' },
  { id: 'p6', full_name: 'Nikodem Styczyński' },
  { id: 'p7', full_name: 'Jan Dawiec' },
  { id: 'p8', full_name: 'Patryk Musiał' },
  { id: 'p9', full_name: 'Wojciech Lis' },
]

test('parseMatchReportText extracts possession, lineup, events, halftime score, summary, and source', () => {
  const sample = `
POSIADANIE 70% • 10 GOLI • CZYSTE KONTO • 30%
SKŁAD WYJŚCIOWY SPORTINGU II
BRAMKA: Kacper Młyńczak
OBRONA: Kacper Styczyński • Ludwik Niemiec
OFENSYWA: Dziyana Darashkova • Jan Wawrzyniak • Nikodem Styczyński
1. POŁOWA
4' 1-0 NIKODEM STYCZYŃSKI
asysta: Jan Wawrzyniak
24' 2-0 JAN DAWIEC
po zamieszaniu w polu karnym
PRZERWA • 5-0
2. POŁOWA
66' 6-0 WOJCIECH LIS
asysta: Patryk Musiał
PODSUMOWANIE
Pewna wygrana Sporting Wrocław II i wyraźna przewaga przez cały mecz.
Jan Dawiec zdobył hat-tricka.
Źródło: szczegółowy przebieg przekazany w PDF
`

  const { draft, warnings } = parseMatchReportText(sample, samplePlayers, {
    locationType: 'home',
  })

  assert.equal(warnings.length, 0)
  assert.equal(draft.home_possession, 70)
  assert.equal(draft.away_possession, 30)
  assert.equal(draft.halftime_home_score, 5)
  assert.equal(draft.halftime_away_score, 0)
  assert.equal(draft.report_source, 'szczegółowy przebieg przekazany w PDF')
  assert.equal(draft.starters.length, 6)
  assert.equal(draft.events.length, 3)

  assert.equal(draft.events[0].half, 1)
  assert.equal(draft.events[0].minute, 4)
  assert.equal(draft.events[0].player_id, 'p6')
  assert.equal(draft.events[0].assist_player_id, 'p5')

  assert.equal(draft.events[1].player_id, 'p7')
  assert.equal(draft.events[1].event_note, 'po zamieszaniu w polu karnym')

  assert.equal(draft.events[2].half, 2)
  assert.equal(draft.events[2].minute, 66)
  assert.equal(draft.events[2].player_id, 'p9')
  assert.equal(draft.events[2].assist_player_id, 'p8')

  assert.match(draft.summary, /Pewna wygrana Sporting Wrocław II/)
})

test('parseMatchReportText parses Sporting_Timeline 3-page PDF and OCR layouts', () => {
  const timelineSample = `
28 : 0
19.11.2026 • 17:00 CET • KONIEC
Sporting Wrocław Błękitni Jerzmanowo
PRZEBIEG MECZU • 1. POŁOWA
Dziyana Darashkova
1′ 1–0
Jędrzej Jaskólski
6′ 2–0
przechwyt i gol
Bruno Mroczkowski
33′ 7–0
(asysta: Patryk Musiał)
PRZERWA • 10–0
Wygenerowano przez Sporting_Timeline PRZEBIEG MECZU
28 : 0
19.11.2026 • 17:00 CET • KONIEC
Sporting Wrocław Błękitni Jerzmanowo
PRZEBIEG MECZU • 2. POŁOWA
48′ Jędrzej Jaskólski
(asysta: Kacper Styczyński)
12–0
KONIEC MECZU • 28–0
Wygenerowano przez Sporting_Timeline PRZEBIEG MECZU
28 : 0
19.11.2026 • 17:00 CET • KONIEC
Sporting Wrocław Błękitni Jerzmanowo
PODSUMOWANIE MECZU
INFORMACJE
SPORTING Arena • sędzia: Radek Błaszczyk
8 °C • wilgotno i deszczowo • bez wiatru • grząskie boisko
SKŁAD WYJŚCIOWY
Kacper Młyńczak • Kacper Styczyński (k) • Ludwik Niemiec • Jan
Wawrzyniak • Dziyana Darashkova • Nikodem Styczyński
STRZELCY
Bruno Mroczkowski • 32′, 33′, 36′, 37′, 61′, 71′ 6 Jan Wawrzyniak • 11′ 1
MVP MECZU • MATEUSZ CISŁO • HAT-TRICK W DEBIUCIE
28 GOLI • CZYSTE KONTO • 10–0 DO PRZERWY
Wygenerowano przez Sporting_Timeline PODSUMOWANIE
`

  const players = [
    ...samplePlayers,
    { id: 'p10', full_name: 'Jędrzej Jaskólski' },
    { id: 'p11', full_name: 'Bruno Mroczkowski' },
  ]

  const { draft, warnings } = parseMatchReportText(timelineSample, players, {
    locationType: 'home',
  })

  assert.equal(warnings.length, 0)
  assert.equal(draft.halftime_home_score, 10)
  assert.equal(draft.halftime_away_score, 0)
  assert.equal(draft.report_source, 'Sporting Timeline')
  assert.equal(draft.starters.length, 6)
  assert.equal(draft.starters[0].player_id, 'p1')
  assert.equal(draft.starters[0].lineup_line, 'goalkeeper')
  assert.equal(draft.starters[1].player_id, 'p2')

  assert.equal(draft.events.length, 4)
  assert.equal(draft.events[0].minute, 1)
  assert.equal(draft.events[0].player_id, 'p4')
  assert.equal(draft.events[1].minute, 6)
  assert.equal(draft.events[1].player_id, 'p10')
  assert.equal(draft.events[1].event_note, 'przechwyt i gol')
  assert.equal(draft.events[2].minute, 33)
  assert.equal(draft.events[2].player_id, 'p11')
  assert.equal(draft.events[2].assist_player_id, 'p8')
  assert.equal(draft.events[3].half, 2)
  assert.equal(draft.events[3].minute, 48)
  assert.equal(draft.events[3].player_id, 'p10')
  assert.equal(draft.events[3].assist_player_id, 'p2')

  assert.match(draft.summary, /sędzia: Radek Błaszczyk/)
  assert.match(draft.summary, /MVP MECZU • MATEUSZ CISŁO/)
  assert.doesNotMatch(draft.summary, /STRZELCY/)
  assert.doesNotMatch(draft.summary, /Wygenerowano przez/)
})
