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
  player_name?: string | null
  player_name_override: string | null
  assist_player_id: string | null
  assist_player_name?: string | null
  event_note: string | null
}

export type ParsedMatchReportStarter = {
  player_id: string
  player_name?: string
  lineup_line: LineupLine
}

export type ParsedMatchReportDraft = {
  home_possession: number | null
  away_possession: number | null
  halftime_home_score: number | null
  halftime_away_score: number | null
  summary: string | null
  report_source: string | null
  starters: ParsedMatchReportStarter[]
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

export function cleanPlayerNameToken(raw: string): string {
  return raw
    .replace(/\((?:k|c|br|gk|kapitan)\)/gi, '')
    .replace(/[⚽🟨🟥]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function findMatchingPlayer(
  rawName: string,
  players: readonly MatchReportCandidatePlayer[],
): MatchReportCandidatePlayer | null {
  const cleaned = cleanPlayerNameToken(rawName)
  const target = normalizePolishText(cleaned)
  if (!target) return null

  const exact = players.find(
    (player) => normalizePolishText(player.full_name) === target,
  )
  if (exact) return exact

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
    .map((item) => cleanPlayerNameToken(item))
    .filter((item) => item.length >= 2)
}

function parseMinuteAndScore(line: string): {
  minute: number
  homeScore: number | null
  awayScore: number | null
  rest: string
} | null {
  // Reject lines that contain multiple minutes like "Bruno Mroczkowski • 32′, 33′, 36′"
  if (/\d{1,3}\s*['’′]\s*,\s*\d{1,3}\s*['’′]/.test(line)) {
    return null
  }

  // Matches e.g. "4' 1-0 NIKODEM STYCZYŃSKI", "1′ 1–0", "1′ Dziyana Darashkova 1–0", "6′ Jędrzej Jaskólski"
  const leadingMinute = line.match(
    /^(\d{1,3})\s*['’′]\s*(?:(\d{1,2})\s*[-–:]\s*(\d{1,2})\s*)?(.*)$/,
  )
  if (leadingMinute) {
    let rest = leadingMinute[4]?.trim() ?? ''
    let homeScore =
      leadingMinute[2] !== undefined ? Number(leadingMinute[2]) : null
    let awayScore =
      leadingMinute[3] !== undefined ? Number(leadingMinute[3]) : null

    // Also handle "1′ Dziyana Darashkova 1–0" where score is at the end of `rest`
    if (homeScore === null && awayScore === null && rest) {
      const trailingScore = rest.match(/^(.*?)\s+(\d{1,2})\s*[-–:]\s*(\d{1,2})$/)
      if (trailingScore) {
        rest = trailingScore[1]?.trim() ?? ''
        homeScore = Number(trailingScore[2])
        awayScore = Number(trailingScore[3])
      }
    }

    return {
      minute: Number(leadingMinute[1]),
      homeScore,
      awayScore,
      rest,
    }
  }

  const embedded = line.match(
    /^(.*?)\s+(\d{1,3})\s*['’′]\s*(?:(\d{1,2})\s*[-–:]\s*(\d{1,2}))?(.*)$/,
  )
  if (embedded) {
    const combinedRest =
      `${embedded[1]?.trim() ?? ''} ${embedded[5]?.trim() ?? ''}`.trim()
    return {
      minute: Number(embedded[2]),
      homeScore: embedded[3] !== undefined ? Number(embedded[3]) : null,
      awayScore: embedded[4] !== undefined ? Number(embedded[4]) : null,
      rest: combinedRest,
    }
  }

  return null
}

function isBareMinuteAndScore(line: string | undefined): boolean {
  if (!line) return false
  const parsed = parseMinuteAndScore(line)
  return Boolean(parsed && !parsed.rest)
}

function isStandaloneScoreLine(
  line: string | undefined,
): { homeScore: number; awayScore: number } | null {
  if (!line) return null
  const match = line.match(/^(\d{1,2})\s*[-–:]\s*(\d{1,2})$/)
  if (!match) return null
  return { homeScore: Number(match[1]), awayScore: Number(match[2]) }
}

function isBoilerplateHeaderOrFooter(line: string, upper: string): boolean {
  if (/^\d{1,2}\s*:\s*\d{1,2}$/.test(line)) return true
  if (
    /^\d{2}\.\d{2}\.\d{4}\s*[•·]/.test(line) ||
    /\bCET\b.*KONIEC/i.test(line)
  ) {
    return true
  }
  if (
    upper.startsWith('mecz u siebie') ||
    upper.startsWith('mecz wyjazdowy') ||
    upper.startsWith('koniec meczu') ||
    upper.startsWith('wynik koncowy')
  ) {
    return true
  }
  if (
    /\bGOLI\b.*\bCZYSTE KONTO\b/i.test(line) ||
    /\bDO PRZERWY\b/i.test(line)
  ) {
    return true
  }
  return false
}

function isStructuralHeader(line: string, upper: string): boolean {
  if (isBoilerplateHeaderOrFooter(line, upper)) return true
  return (
    /\b1\s*\.?\s*po[lł]owa\b/i.test(line) ||
    /\b2\s*\.?\s*po[lł]owa\b/i.test(line) ||
    /^PRZERWA\b/i.test(line) ||
    /^PODSUMOWANIE\b/i.test(line) ||
    /^INFORMACJE\b/i.test(line) ||
    /^SK[ŁL]AD\s+WYJ[ŚS]CIOWY/i.test(line) ||
    /^STRZELCY\b/i.test(line) ||
    /^MVP\s+MECZU\b/i.test(line) ||
    /^(?:Źródło|Zrodlo)\s*[:\-]/i.test(line) ||
    /^Wygenerowano\s+przez\b/i.test(line) ||
    /^PRZEBIEG\s*(?:\/\s*WYNIK)?\s*MECZU$/i.test(line)
  )
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
  let hasExplicitSource = false

  const starters: ParsedMatchReportStarter[] = []
  const starterIds = new Set<string>()
  const unprefixedLineupChunks: string[] = []

  const events: ParsedMatchReportEvent[] = []
  const summaryLines: string[] = []

  type Section = 'timeline' | 'summary' | 'lineup' | 'scorers'
  let section: Section = 'timeline'
  let currentHalf: 1 | 2 = 1
  let prevHome = 0
  let prevAway = 0
  let pendingActorName: string | null = null

  const addStarter = (rawName: string, lineupLine: LineupLine) => {
    const cleaned = cleanPlayerNameToken(rawName)
    if (!cleaned) return
    const player = findMatchingPlayer(cleaned, players)
    if (player) {
      if (!starterIds.has(player.id)) {
        starterIds.add(player.id)
        starters.push({
          player_id: player.id,
          player_name: player.full_name,
          lineup_line: lineupLine,
        })
      }
    } else {
      warnings.push(`Nie znaleziono w kadrze (skład): "${cleaned}"`)
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!
    const upper = normalizePolishText(line)

    // 1. Source / Generator line
    const sourceMatch = line.match(/^(?:Źródło|Zrodlo)\s*[:\-]\s*(.+)$/i)
    if (sourceMatch) {
      reportSource = sourceMatch[1]!.trim()
      hasExplicitSource = true
      pendingActorName = null
      continue
    }

    const generatorMatch = line.match(
      /^Wygenerowano\s+przez\s+([^\s]+)(?:\s+.*)?$/i,
    )
    if (generatorMatch) {
      if (!hasExplicitSource) {
        reportSource = generatorMatch[1]!.replace(/_/g, ' ')
      }
      pendingActorName = null
      continue
    }

    // 2. Possession line: e.g. "POSIADANIE 70% ... 30%"
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
      pendingActorName = null
      continue
    }

    // 3. Halftime marker: "PRZERWA • 10–0" or "28 GOLI • CZYSTE KONTO • 10–0 DO PRZERWY"
    const htMatch =
      line.match(/^PRZERWA[^\d]*(\d{1,2})\s*[-–:]\s*(\d{1,2})/i) ??
      line.match(/(\d{1,2})\s*[-–:]\s*(\d{1,2})\s+DO\s+PRZERWY/i)
    if (htMatch) {
      halftimeHomeScore = Number(htMatch[1])
      halftimeAwayScore = Number(htMatch[2])
      if (/^PRZERWA/i.test(line)) {
        currentHalf = 2
      }
      pendingActorName = null
      continue
    }

    // 4. Section headers
    if (/\b1\s*\.?\s*po[lł]owa\b/i.test(line) && !/^Wypo[żz]yczenie/i.test(line)) {
      section = 'timeline'
      currentHalf = 1
      pendingActorName = null
      continue
    }
    if (/\b2\s*\.?\s*po[lł]owa\b/i.test(line) && !/^Wypo[żz]yczenie/i.test(line)) {
      section = 'timeline'
      currentHalf = 2
      pendingActorName = null
      continue
    }
    if (/^PRZEBIEG\s*(?:\/\s*WYNIK)?\s*MECZU$/i.test(line)) {
      section = 'timeline'
      pendingActorName = null
      continue
    }
    if (/^SK[ŁL]AD\s+WYJ[ŚS]CIOWY/i.test(line)) {
      section = 'lineup'
      pendingActorName = null
      continue
    }
    if (/^STRZELCY\b/i.test(line)) {
      section = 'scorers'
      pendingActorName = null
      continue
    }
    if (/^PODSUMOWANIE(?:\s+MECZU)?\b/i.test(line)) {
      section = 'summary'
      pendingActorName = null
      const inline = line
        .replace(/^podsumowanie(?:\s+meczu)?\s*[:\-]?\s*/i, '')
        .trim()
      if (inline) summaryLines.push(inline)
      continue
    }
    if (/^INFORMACJE\b/i.test(line)) {
      section = 'summary'
      pendingActorName = null
      continue
    }
    if (/^MVP\s+MECZU\b/i.test(line)) {
      summaryLines.push(line)
      pendingActorName = null
      continue
    }

    // Skip repeated scoreboard headers/footers (e.g. "28 : 0", "19.11.2026 • 17:00 CET • KONIEC")
    if (isBoilerplateHeaderOrFooter(line, upper)) {
      pendingActorName = null
      continue
    }
    // Also skip the team-names line right after the date/score header
    if (
      i > 0 &&
      (/^\d{1,2}\s*:\s*\d{1,2}$/.test(lines[i - 1]!) ||
        /\bCET\b.*KONIEC/i.test(lines[i - 1]!)) &&
      !parseMinuteAndScore(line)
    ) {
      continue
    }

    // 5. Prefix-based lineup lines (can appear anywhere)
    let matchedLineupPrefix = false
    for (const { pattern, line: lineupLine } of LINE_KEYWORDS) {
      const match = line.match(pattern)
      if (!match) continue
      matchedLineupPrefix = true
      for (const rawName of splitPlayerList(match[1]!)) {
        addStarter(rawName, lineupLine)
      }
      break
    }
    if (matchedLineupPrefix) {
      pendingActorName = null
      continue
    }

    // 6. Handle section-specific content
    if (section === 'lineup') {
      unprefixedLineupChunks.push(line)
      continue
    }

    if (section === 'scorers') {
      continue
    }

    if (section === 'summary') {
      summaryLines.push(line)
      continue
    }

    // 7. Timeline section
    const parsedEvent = parseMinuteAndScore(line)
    if (!parsedEvent || parsedEvent.minute < 1 || parsedEvent.minute > 150) {
      // In PDF coordinate extraction, the scorer's name often appears on the line right before "1′ 1–0"
      if (isBareMinuteAndScore(lines[i + 1])) {
        pendingActorName = line
      }
      continue
    }

    let actorText = parsedEvent.rest || pendingActorName || ''
    pendingActorName = null

    let homeScore = parsedEvent.homeScore
    let awayScore = parsedEvent.awayScore
    let noteText: string | null = null
    let assistPlayerId: string | null = null
    let assistPlayerName: string | null = null

    const consumeSubtextLine = (subLine: string): boolean => {
      const cleanedSub = subLine.replace(/^\(|\)$/g, '').trim()
      const assistMatch = cleanedSub.match(/^asysta\s*[:\-]\s*(.+)$/i)
      if (assistMatch) {
        const assistName = assistMatch[1]!.replace(/\)$/, '').trim()
        const assistPlayer = findMatchingPlayer(assistName, players)
        if (assistPlayer) {
          assistPlayerId = assistPlayer.id
          assistPlayerName = assistPlayer.full_name
        } else {
          noteText = `asysta: ${assistName}`
        }
        return true
      }
      noteText = noteText ? `${noteText} • ${cleanedSub}` : cleanedSub
      return true
    }

    // Inline assist inside actorText
    const inlineAssist = actorText.match(/\(?\s*asysta\s*[:\-]\s*([^)]+)\)?$/i)
    if (inlineAssist) {
      actorText = actorText.slice(0, inlineAssist.index).trim()
      const assistName = inlineAssist[1]!.trim()
      const assistPlayer = findMatchingPlayer(assistName, players)
      if (assistPlayer) {
        assistPlayerId = assistPlayer.id
        assistPlayerName = assistPlayer.full_name
      } else {
        noteText = `asysta: ${assistName}`
      }
    }

    // Look ahead for sub-note / assist and/or standalone score line ("2–0")
    const nextLine = lines[i + 1]
    if (
      nextLine &&
      !isStructuralHeader(nextLine, normalizePolishText(nextLine))
    ) {
      const nextScoreOnly = isStandaloneScoreLine(nextLine)
      if (nextScoreOnly && homeScore === null && awayScore === null) {
        homeScore = nextScoreOnly.homeScore
        awayScore = nextScoreOnly.awayScore
        i += 1
      } else if (
        !parseMinuteAndScore(nextLine) &&
        !isBareMinuteAndScore(lines[i + 2])
      ) {
        // `nextLine` is a subtext line (like "przechwyt i gol" or "(asysta: Patryk Musiał)"),
        // NOT the player name for a bare minute-score on lines[i + 2]!
        consumeSubtextLine(nextLine)
        i += 1

        // Also check if a standalone score line ("2–0") follows the subtext line (OCR Layout B)
        const afterSubScore = isStandaloneScoreLine(lines[i + 1])
        if (afterSubScore && homeScore === null && awayScore === null) {
          homeScore = afterSubScore.homeScore
          awayScore = afterSubScore.awayScore
          i += 1
        }
      }
    }

    let eventType: GameEventType = 'goal'
    const combinedContext = `${actorText} ${noteText ?? ''}`
    if (/samob[oó]j/i.test(combinedContext)) eventType = 'own_goal'
    else if (/karny|z karnego|rzut karny/i.test(combinedContext))
      eventType = 'penalty_goal'
    else if (/żółt|zolt/i.test(actorText)) eventType = 'yellow_card'
    else if (/czerwon/i.test(actorText)) eventType = 'red_card'

    let isOurTeam = true
    if (
      homeScore !== null &&
      awayScore !== null &&
      eventType !== 'yellow_card' &&
      eventType !== 'red_card'
    ) {
      const homeDelta = homeScore - prevHome
      const awayDelta = awayScore - prevAway
      const ourIsHome = options.locationType !== 'away'
      if (homeDelta > 0 && awayDelta === 0) {
        isOurTeam = ourIsHome
      } else if (awayDelta > 0 && homeDelta === 0) {
        isOurTeam = !ourIsHome
      }
      prevHome = homeScore
      prevAway = awayScore
    }

    const cleanedActor = cleanPlayerNameToken(
      actorText.replace(/\((?:karny|samobój|k\.|sam\.)\)/gi, ''),
    )
    const matchedActor = isOurTeam
      ? findMatchingPlayer(cleanedActor, players)
      : null

    if (isOurTeam && cleanedActor && !matchedActor) {
      warnings.push(
        `Nie znaleziono w kadrze (zdarzenie ${parsedEvent.minute}'): "${cleanedActor}"`,
      )
    }

    events.push({
      half: parsedEvent.minute > 45 && currentHalf === 1 ? 2 : currentHalf,
      minute: parsedEvent.minute,
      event_type: eventType,
      is_our_team: isOurTeam,
      player_id: matchedActor ? matchedActor.id : null,
      player_name: matchedActor ? matchedActor.full_name : null,
      player_name_override: matchedActor ? null : cleanedActor || null,
      assist_player_id: assistPlayerId,
      assist_player_name: assistPlayerName,
      event_note: noteText,
    })
  }

  // Process unprefixed SKŁAD WYJŚCIOWY block (e.g. Page 3 of Sporting_Timeline PDF)
  if (unprefixedLineupChunks.length && !starters.length) {
    const rawNames = splitPlayerList(unprefixedLineupChunks.join(' '))
    const total = rawNames.length
    const defenseCutoff = Math.max(1, Math.ceil((total - 1) / 2))
    rawNames.forEach((rawName, idx) => {
      const defaultLine: LineupLine =
        idx === 0
          ? 'goalkeeper'
          : idx <= defenseCutoff
            ? 'defense'
            : 'offense'
      addStarter(rawName, defaultLine)
    })
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
