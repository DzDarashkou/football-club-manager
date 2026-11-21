import type {
  AdminGame,
  GameEvent,
  GameEventType,
  GameLocationType,
  GamePlayer,
  LineupLine,
} from '@@/types/admin-club'

export const LINEUP_LINE_ORDER: readonly LineupLine[] = [
  'goalkeeper',
  'defense',
  'midfield',
  'offense',
]

export const LINEUP_LINE_LABELS: Record<LineupLine, string> = {
  goalkeeper: 'Bramka',
  defense: 'Obrona',
  midfield: 'Pomoc',
  offense: 'Ofensywa',
}

const GOAL_TYPES = new Set<GameEventType>([
  'goal',
  'own_goal',
  'penalty_goal',
])

export function isGoalEvent(eventType: GameEventType): boolean {
  return GOAL_TYPES.has(eventType)
}

export type TimelineEventInput = {
  half: 1 | 2
  minute: number
  event_type: GameEventType
  is_our_team: boolean
  sort_order?: number
}

export function computeRunningScores<T extends TimelineEventInput>(
  events: readonly T[],
  locationType: GameLocationType,
): {
  events: Array<T & { home_score_after: number | null; away_score_after: number | null; sort_order: number }>
  homeScore: number
  awayScore: number
  halftimeHomeScore: number
  halftimeAwayScore: number
} {
  const ordered = [...events]
    .map((event, index) => ({
      ...event,
      sort_order: event.sort_order ?? index,
    }))
    .sort((a, b) => {
      if (a.half !== b.half) return a.half - b.half
      if (a.minute !== b.minute) return a.minute - b.minute
      return a.sort_order - b.sort_order
    })

  const ourTeamIsHome = locationType !== 'away'
  let homeScore = 0
  let awayScore = 0
  let halftimeHomeScore = 0
  let halftimeAwayScore = 0

  const scored = ordered.map((event) => {
    if (!isGoalEvent(event.event_type)) {
      return {
        ...event,
        home_score_after: null,
        away_score_after: null,
      }
    }

    const pointForOurTeam =
      event.event_type === 'own_goal' ? !event.is_our_team : event.is_our_team
    const pointForHome = ourTeamIsHome ? pointForOurTeam : !pointForOurTeam

    if (pointForHome) homeScore += 1
    else awayScore += 1

    if (event.half === 1) {
      halftimeHomeScore = homeScore
      halftimeAwayScore = awayScore
    }

    return {
      ...event,
      home_score_after: homeScore,
      away_score_after: awayScore,
    }
  })

  return {
    events: scored,
    homeScore,
    awayScore,
    halftimeHomeScore,
    halftimeAwayScore,
  }
}

export function groupLineupStarters(players: readonly GamePlayer[]): Array<{
  line: LineupLine
  label: string
  players: GamePlayer[]
}> {
  const starters = players.filter(
    (player) =>
      player.selection_status === 'started' && Boolean(player.lineup_line),
  )

  return LINEUP_LINE_ORDER.flatMap((line) => {
    const linePlayers = starters.filter((player) => player.lineup_line === line)
    return linePlayers.length
      ? [{ line, label: LINEUP_LINE_LABELS[line], players: linePlayers }]
      : []
  })
}

export function eventDisplayName(
  event: Pick<GameEvent, 'player' | 'player_name_override' | 'is_our_team'>,
  opponentName: string,
): string {
  if (event.player?.full_name) return event.player.full_name
  if (event.player_name_override?.trim()) return event.player_name_override.trim()
  return event.is_our_team ? 'Zawodnik drużyny' : opponentName
}

export type PlayerEventStatTotals = {
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
}

export function summarizePlayerEventStats(
  events: readonly Pick<
    GameEvent,
    'event_type' | 'is_our_team' | 'player_id' | 'assist_player_id'
  >[],
): Map<string, PlayerEventStatTotals> {
  const totals = new Map<string, PlayerEventStatTotals>()
  const ensure = (playerId: string) => {
    let entry = totals.get(playerId)
    if (!entry) {
      entry = { goals: 0, assists: 0, yellow_cards: 0, red_cards: 0 }
      totals.set(playerId, entry)
    }
    return entry
  }

  for (const event of events) {
    if (!event.is_our_team) continue

    if (event.player_id) {
      const entry = ensure(event.player_id)
      if (event.event_type === 'goal' || event.event_type === 'penalty_goal') {
        entry.goals += 1
      } else if (event.event_type === 'yellow_card') {
        entry.yellow_cards = Math.min(2, entry.yellow_cards + 1)
      } else if (event.event_type === 'red_card') {
        entry.red_cards = Math.min(1, entry.red_cards + 1)
      }
    }

    if (
      event.assist_player_id &&
      (event.event_type === 'goal' || event.event_type === 'penalty_goal')
    ) {
      ensure(event.assist_player_id).assists += 1
    }
  }

  return totals
}

export function generateMatchSummaryDraft(
  game: Pick<
    AdminGame,
    'team' | 'opponent_name' | 'location_type' | 'home_score' | 'away_score'
  >,
  events: readonly Pick<
    GameEvent,
    'event_type' | 'is_our_team' | 'player' | 'player_name_override'
  >[],
  scoreOverride?: { homeScore: number; awayScore: number },
): string {
  const homeScore = scoreOverride ? scoreOverride.homeScore : game.home_score
  const awayScore = scoreOverride ? scoreOverride.awayScore : game.away_score
  const ourScore = game.location_type === 'away' ? awayScore : homeScore
  const opponentScore = game.location_type === 'away' ? homeScore : awayScore
  const diff = ourScore - opponentScore

  let headline = ''
  if (diff >= 3) {
    headline = `Pewna wygrana ${game.team.name} z ${game.opponent_name} (${homeScore}:${awayScore}).`
  } else if (diff > 0) {
    headline = `Zwycięstwo ${game.team.name} nad ${game.opponent_name} (${homeScore}:${awayScore}).`
  } else if (diff === 0) {
    headline = `Remis w meczu ${game.team.name} z ${game.opponent_name} (${homeScore}:${awayScore}).`
  } else {
    headline = `Porażka ${game.team.name} z ${game.opponent_name} (${homeScore}:${awayScore}).`
  }

  const scorerCounts = new Map<string, number>()
  for (const event of events) {
    if (
      !event.is_our_team ||
      (event.event_type !== 'goal' && event.event_type !== 'penalty_goal')
    ) {
      continue
    }
    const name =
      event.player?.full_name || event.player_name_override?.trim() || ''
    if (!name) continue
    scorerCounts.set(name, (scorerCounts.get(name) ?? 0) + 1)
  }

  const highlights: string[] = []
  for (const [name, count] of scorerCounts.entries()) {
    if (count >= 3) highlights.push(`${name} zdobył hat-tricka (${count} gole)`)
    else if (count === 2) highlights.push(`${name} strzelił dwa gole`)
  }
  if (ourScore > 0 && opponentScore === 0) {
    highlights.push('Drużyna zachowała czyste konto')
  }

  return highlights.length
    ? `${headline}\n${highlights.join('; ')}.`
    : headline
}

export function extractGoogleDriveFileId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl.trim())
    if (
      !url.hostname.endsWith('drive.google.com') &&
      !url.hostname.endsWith('docs.google.com')
    ) {
      return null
    }
    const pathMatch = url.pathname.match(/\/(?:file|document)\/d\/([A-Za-z0-9_-]{10,})/)
    if (pathMatch?.[1]) return pathMatch[1]

    const idParam = url.searchParams.get('id')
    if (idParam && /^[A-Za-z0-9_-]{10,}$/.test(idParam)) return idParam
    return null
  } catch {
    return null
  }
}

export function toPdfDownloadUrl(
  rawUrl: string | null | undefined,
): string | null {
  if (!rawUrl?.trim()) return null
  try {
    const url = new URL(rawUrl.trim())
    if (!['http:', 'https:'].includes(url.protocol)) return null
    const driveId = extractGoogleDriveFileId(url.href)
    if (driveId) {
      return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`
    }
    return url.href
  } catch {
    return null
  }
}
