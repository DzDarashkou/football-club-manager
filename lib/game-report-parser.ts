import type {
  GameEventType,
  GameLocationType,
  LineupLine,
} from '@@/types/admin-club'

export type MatchReportCandidatePlayer = {
  id: string
  full_name: string
}

export type ParsedMatchReportEvent = {
  half: 1 | 2
  minute: number
  event_type: GameEventType
  is_our_team: boolean
  player_id: string | null
  player_name_override: string | null
  assist_player_id: string | null
  event_note: string | null
}

export type ParsedMatchReportDraft = {
  home_possession: number | null
  away_possession: number | null
  halftime_home_score: number | null
  halftime_away_score: number | null
  summary: string | null
  report_source: string | null
  starters: Array<{ player_id: string; lineup_line: LineupLine }>
  events: ParsedMatchReportEvent[]
}

export type ParseMatchReportResult = {
  draft: ParsedMatchReportDraft
  warnings: string[]
}

export function normalizePolishText(value: string): string {
  return value
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findMatchingPlayer(
  rawName: string,
  players: readonly MatchReportCandidatePlayer[],
): MatchReportCandidatePlayer | null {
  const target = normalizePolishText(rawName)
  if (!target) return null

  const exact = players.find(
    (player) => normalizePolishText(player.full_name) === target,
  )
  if (exact) return exact

  // Handle reversed name order ("Nazwisko Imię") or partial surname match if unique
  const targetTokens = target.split(' ').filter(Boolean)
  if (targetTokens.length >= 2) {
    const reversed = [...targetTokens].reverse().join(' ')
    const reversedMatch = players.find(
      (player) => normalizePolishText(player.full_name) === reversed,
    )
    if (reversedMatch) return reversedMatch
  }

  const containsMatches = players.filter((player) => {
    const normalized = normalizePolishText(player.full_name)
    return normalized.includes(target) || target.includes(normalized)
  })
  return containsMatches.length === 1 ? containsMatches[0]! : null
}

const LINE_KEYWORDS: Array<{ pattern: RegExp; line: LineupLine }> = [
  { pattern: /^BRAMK(?:A|ARZ)\s*[:\-–]\s*(.+)$/i, line: 'goalkeeper' },
  { pattern: /^OBRONA\s*[:\-–]\s*(.+)$/i, line: 'defense' },
  { pattern: /^POMOC\s*[:\-–]\s*(.+)$/i, line: 'midfield' },
  { pattern: /^(?:OFENSYWA|ATAK)\s*[:\-–]\s*(.+)$/i, line: 'offense' },
]

function splitPlayerList(raw: string): string[] {
  return raw
    .split(/[•·,;|/]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 2)
}

function parseMinuteAndScore(line: string): {
  minute: number
  homeScore: number | null
  awayScore: number | null
  rest: string
} | null {
  // Matches e.g. "4' 1-0 NIKODEM STYCZYŃSKI" or "NIKODEM STYCZYŃSKI 4' 1–0" or "24' JAN DAWIEC"
  const leadingMinute = line.match(
    /^(\d{1,3})\s*['’]\s*(?:(\d{1,2})\s*[-–:]\s*(\d{1,2})\s*)?(.*)$/,
  )
  if (leadingMinute) {
    return {
      minute: Number(leadingMinute[1]),
      homeScore: leadingMinute[2] !== undefined ? Number(leadingMinute[2]) : null,
      awayScore: leadingMinute[3] !== undefined ? Number(leadingMinute[3]) : null,
      rest: leadingMinute[4]?.trim() ?? '',
    }
  }

  const embedded = line.match(
    /^(.*?)\s+(\d{1,3})\s*['’]\s*(?:(\d{1,2})\s*[-–:]\s*(\d{1,2}))?(.*)$/,
  )
  if (embedded) {
    const combinedRest = `${embedded[1]?.trim() ?? ''} ${embedded[5]?.trim() ?? ''}`.trim()
    return {
      minute: Number(embedded[2]),
      homeScore: embedded[3] !== undefined ? Number(embedded[3]) : null,
      awayScore: embedded[4] !== undefined ? Number(embedded[4]) : null,
      rest: combinedRest,
    }
  }

  return null
}

export function parseMatchReportText(
  rawText: string,
  players: readonly MatchReportCandidatePlayer[],
  options: {
    locationType?: GameLocationType
    defaultSource?: string | null
  } = {},
): ParseMatchReportResult {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const warnings: string[] = []
  let homePossession: number | null = null
  let awayPossession: number | null = null
  let halftimeHomeScore: number | null = null
  let halftimeAwayScore: number | null = null
  let reportSource: string | null = options.defaultSource ?? null
  const starters: Array<{ player_id: string; lineup_line: LineupLine }> = []
  const starterIds = new Set<string>()
  const events: ParsedMatchReportEvent[] = []
  const summaryLines: string[] = []

  let currentHalf: 1 | 2 = 1
  let inSummary = false
  let prevHome = 0
  let prevAway = 0

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!
    const upper = normalizePolishText(line)

    // Source line
    const sourceMatch = line.match(/^(?:Źródło|Zrodlo)\s*[:\-]\s*(.+)$/i)
    if (sourceMatch) {
      reportSource = sourceMatch[1]!.trim()
      inSummary = false
      continue
    }

    // Possession line: e.g. "POSIADANIE 70% ... 30%" or "Posiadanie: 65% - 35%"
    if (upper.includes('posiadanie')) {
      const percentages = [...line.matchAll(/(\d{1,3})\s*%/g)].map((m) =>
        Number(m[1]),
      )
      if (
        percentages.length >= 2 &&
        percentages[0]! + percentages[1]! === 100
      ) {
        homePossession = percentages[0]!
        awayPossession = percentages[1]!
      } else if (percentages.length === 1 && percentages[0]! <= 100) {
        homePossession = percentages[0]!
        awayPossession = 100 - percentages[0]!
      }
      continue
    }

    // Halftime marker: "PRZERWA • 5-0"
    const htMatch = line.match(/PRZERWA[^\d]*(\d{1,2})\s*[-–:]\s*(\d{1,2})/i)
    if (htMatch) {
      halftimeHomeScore = Number(htMatch[1])
      halftimeAwayScore = Number(htMatch[2])
      currentHalf = 2
      continue
    }

    if (upper.startsWith('1 polowa') || upper === '1 polowa') {
      currentHalf = 1
      inSummary = false
      continue
    }
    if (upper.startsWith('2 polowa') || upper === '2 polowa') {
      currentHalf = 2
      inSummary = false
      continue
    }

    if (upper.startsWith('podsumowanie')) {
      inSummary = true
      const inline = line.replace(/^podsumowanie\s*[:\-]?\s*/i, '').trim()
      if (inline) summaryLines.push(inline)
      continue
    }

    if (
      upper.startsWith('mecz u siebie') ||
      upper.startsWith('mecz wyjazdowy') ||
      upper.startsWith('koniec meczu') ||
      upper.startsWith('wynik koncowy')
    ) {
      inSummary = false
      continue
    }

    if (inSummary) {
      summaryLines.push(line)
      continue
    }

    // Lineup lines
    let matchedLineup = false
    for (const { pattern, line: lineupLine } of LINE_KEYWORDS) {
      const match = line.match(pattern)
      if (!match) continue
      matchedLineup = true
      for (const rawName of splitPlayerList(match[1]!)) {
        const player = findMatchingPlayer(rawName, players)
        if (player) {
          if (!starterIds.has(player.id)) {
            starterIds.add(player.id)
            starters.push({ player_id: player.id, lineup_line: lineupLine })
          }
        } else {
          warnings.push(`Nie znaleziono w kadrze (skład): "${rawName}"`)
        }
      }
      break
    }
    if (matchedLineup) continue

    // Timeline event line
    const parsedEvent = parseMinuteAndScore(line)
    if (parsedEvent && parsedEvent.minute >= 1 && parsedEvent.minute <= 150) {
      let eventType: GameEventType = 'goal'
      let actorText = parsedEvent.rest
      let noteText: string | null = null
      let assistPlayerId: string | null = null

      if (/samob[oó]j/i.test(actorText)) eventType = 'own_goal'
      else if (/karny|z karnego|rzut karny/i.test(actorText))
        eventType = 'penalty_goal'
      else if (/żółt|zolt/i.test(actorText)) eventType = 'yellow_card'
      else if (/czerwon/i.test(actorText)) eventType = 'red_card'

      // Check inline assist or next-line assist / context note
      const inlineAssist = actorText.match(/asysta\s*[:\-]\s*(.+)$/i)
      if (inlineAssist) {
        actorText = actorText.slice(0, inlineAssist.index).trim()
        const assistPlayer = findMatchingPlayer(inlineAssist[1]!, players)
        if (assistPlayer) assistPlayerId = assistPlayer.id
        else noteText = `asysta: ${inlineAssist[1]!.trim()}`
      }

      // Peek next line for subtext like "asysta: Jan Wawrzyniak" or "po zamieszaniu w polu karnym"
      const nextLine = lines[i + 1]
      if (
        nextLine &&
        !parseMinuteAndScore(nextLine) &&
        !/^(?:1\.|2\.)\s*POŁOWA|PRZERWA|KONIEC|PODSUMOWANIE|ŹRÓDŁO/i.test(
          nextLine,
        )
      ) {
        const nextAssist = nextLine.match(/^asysta\s*[:\-]\s*(.+)$/i)
        if (nextAssist) {
          const assistPlayer = findMatchingPlayer(nextAssist[1]!, players)
          if (assistPlayer) assistPlayerId = assistPlayer.id
          else noteText = nextLine
          i += 1
        } else if (
          /^(?:po |z |rzut|strzał|strzal|główk|glowk|dobitk|samob|karn)/i.test(
            nextLine,
          )
        ) {
          noteText = noteText ? `${noteText} • ${nextLine}` : nextLine
          i += 1
        }
      }

      // Determine which team scored from running score delta if available
      let isOurTeam = true
      if (
        parsedEvent.homeScore !== null &&
        parsedEvent.awayScore !== null &&
        eventType !== 'yellow_card' &&
        eventType !== 'red_card'
      ) {
        const homeDelta = parsedEvent.homeScore - prevHome
        const awayDelta = parsedEvent.awayScore - prevAway
        const ourIsHome = options.locationType !== 'away'
        if (homeDelta > 0 && awayDelta === 0) {
          isOurTeam = ourIsHome
        } else if (awayDelta > 0 && homeDelta === 0) {
          isOurTeam = !ourIsHome
        }
        prevHome = parsedEvent.homeScore
        prevAway = parsedEvent.awayScore
      }

      const cleanedActor = actorText
        .replace(/[⚽🟨🟥]/g, '')
        .replace(/\((?:karny|samobój|k\.|sam\.)\)/gi, '')
        .trim()
      const matchedActor = isOurTeam
        ? findMatchingPlayer(cleanedActor, players)
        : null

      if (isOurTeam && cleanedActor && !matchedActor) {
        warnings.push(`Nie znaleziono w kadrze (zdarzenie ${parsedEvent.minute}'): "${cleanedActor}"`)
      }

      events.push({
        half: parsedEvent.minute > 45 && currentHalf === 1 ? 2 : currentHalf,
        minute: parsedEvent.minute,
        event_type: eventType,
        is_our_team: isOurTeam,
        player_id: matchedActor ? matchedActor.id : null,
        player_name_override: matchedActor ? null : cleanedActor || null,
        assist_player_id: assistPlayerId,
        event_note: noteText,
      })
    }
  }

  return {
    draft: {
      home_possession: homePossession,
      away_possession: awayPossession,
      halftime_home_score: halftimeHomeScore,
      halftime_away_score: halftimeAwayScore,
      summary: summaryLines.length ? summaryLines.join('\n') : null,
      report_source: reportSource,
      starters,
      events,
    },
    warnings,
  }
}
