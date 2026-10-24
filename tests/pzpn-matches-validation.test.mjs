import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  parsePzpnMatchesJson,
  parseStadiumInfo,
  parsePzpnDateTimeToUtcIso,
  mapPzpnStateToGameStatus,
  extractScores,
} from '../validators/pzpn-matches.ts'

const sampleMatchesJson = [
  {
    matchId: 'c71d614b-d0f3-42b4-ab24-2c33a1c84ba2',
    state: 'Nierozegrany',
    dateTime: '2026-10-26T17:00:00',
    canDateTimeChange: true,
    scores: {},
    host: {
      id: '6fd0b3db-2d4a-4281-a07f-f873ae83e0d8',
      logo: 'https://cdn.laczynaspilka.pl/content/static/pz/images/e/3/7/6329ae5692382fb95583a73e__w64',
      name: 'PARASOL IV WROCŁAW',
      abbreviation: 'PAR',
    },
    guest: {
      id: '13a8f1cd-7d40-43ce-be56-2c91c7b2a20e',
      logo: 'https://cdn.laczynaspilka.pl/content/static/pz/images/4/1/9/660559eca893e47ddc072914__w64',
      name: 'SPORTING WROCŁAW',
      abbreviation: 'SPO',
    },
    league: {
      id: '7c5a509a-2dac-46a7-9a37-54d48719758b',
      name: 'D1',
    },
    play: {
      id: 'a1c643cf-b745-4bbe-81e8-ea058315b548',
      name: 'Wrocław:  V liga okręgowa D1 Młodzik Grupa 1',
    },
    stadium: 'Sporting Arena (Wrocław, Sukielicka 13)',
    transmissions: [],
    queue: 8,
    round: 'Autumn',
  },
  {
    matchId: 'bf0043ed-efad-42c1-87f0-0c90e710d3f4',
    state: 'Nierozegrany',
    dateTime: '2026-11-08T15:00:00',
    canDateTimeChange: true,
    scores: {},
    host: {
      id: '13a8f1cd-7d40-43ce-be56-2c91c7b2a20e',
      logo: 'https://cdn.laczynaspilka.pl/content/static/pz/images/4/1/9/660559eca893e47ddc072914__w64',
      name: 'SPORTING WROCŁAW',
      abbreviation: 'SPO',
    },
    guest: {
      id: '5bb27ecc-c026-45e2-990c-033affdb5485',
      logo: 'https://cdn.laczynaspilka.pl/content/static/pz/images/6/a/3/69d77c28a893e47ddc14f3a6__w64',
      name: 'BÓR OBORNIKI ŚLĄSKIE',
      abbreviation: 'BÓR',
    },
    league: {
      id: '7c5a509a-2dac-46a7-9a37-54d48719758b',
      name: 'D1',
    },
    play: {
      id: 'a1c643cf-b745-4bbe-81e8-ea058315b548',
      name: 'Wrocław:  V liga okręgowa D1 Młodzik Grupa 1',
    },
    stadium: 'Sukielicka 13 , 54-311 Wrocław',
    transmissions: [],
    queue: 9,
    round: 'Autumn',
  },
]

test('correctly parses user PZPN match JSON sample', () => {
  const matches = parsePzpnMatchesJson(sampleMatchesJson)
  assert.equal(matches.length, 2)
  assert.equal(matches[0].matchId, 'c71d614b-d0f3-42b4-ab24-2c33a1c84ba2')
  assert.equal(matches[0].queue, 8)
  assert.equal(matches[0].host.name, 'PARASOL IV WROCŁAW')
  assert.equal(matches[0].guest.name, 'SPORTING WROCŁAW')
  assert.equal(matches[1].host.name, 'SPORTING WROCŁAW')
  assert.equal(matches[1].guest.name, 'BÓR OBORNIKI ŚLĄSKIE')
})

test('parses stadium names and addresses', () => {
  const stadium1 = parseStadiumInfo('Sporting Arena (Wrocław, Sukielicka 13)')
  assert.deepEqual(stadium1, {
    name: 'Sporting Arena',
    address: 'Wrocław, Sukielicka 13',
    city: 'Wrocław',
  })

  const stadium2 = parseStadiumInfo('Sukielicka 13 , 54-311 Wrocław')
  assert.deepEqual(stadium2, {
    name: 'Sukielicka 13 , 54-311 Wrocław',
    address: 'Sukielicka 13 , 54-311 Wrocław',
    city: 'Wrocław',
  })

  assert.equal(parseStadiumInfo(null), null)
})

test('maps PZPN states and scores', () => {
  assert.equal(mapPzpnStateToGameStatus('Nierozegrany'), 'scheduled')
  assert.equal(mapPzpnStateToGameStatus('Zakończony'), 'completed')
  assert.equal(mapPzpnStateToGameStatus('Przełożony'), 'postponed')
  assert.equal(mapPzpnStateToGameStatus('Odwołany'), 'cancelled')

  const flatScores = extractScores({ host: 4, guest: 2 })
  assert.deepEqual(flatScores, { homeScore: 4, awayScore: 2 })

  const nestedScores = extractScores({ main: { host: 1, guest: 0 } })
  assert.deepEqual(nestedScores, { homeScore: 1, awayScore: 0 })
})

test('converts PZPN Polish local date-time to valid ISO string', () => {
  const iso = parsePzpnDateTimeToUtcIso('2026-10-26T17:00:00')
  assert.ok(typeof iso === 'string' && !Number.isNaN(Date.parse(iso)))
  const date = new Date(iso)
  assert.equal(date.getUTCFullYear(), 2026)
  assert.equal(date.getUTCMonth(), 9) // 0-indexed: October is 9
  assert.equal(date.getUTCDate(), 26)
})

