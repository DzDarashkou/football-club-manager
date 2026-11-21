import { getGames } from '@@/server/utils/admin-games'
import { handleApiError } from '@@/server/utils/admin-users'
import { requireCalendarAccess } from '@@/server/utils/game-attendance'
import type {
  AdminGame,
  GameEvent,
  GameEventType,
  GamePlayer,
} from '@@/types/admin-club'

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireCalendarAccess(event)

  const games = await getGames(adminClient, {
    includeAll: true,
    excludeDraft: true,
    ascending: false,
  })

  if (!games.length) {
    return { reports: [], teams: [] }
  }

  const gameIds = games.map((game) => game.id)

  const [eventsResult, startersResult, playersResult] = await Promise.all([
    adminClient
      .from('game_events')
      .select(
        'id, game_id, half, minute, event_type, is_our_team, player_id, player_name_override, assist_player_id, event_note, home_score_after, away_score_after, sort_order',
      )
      .in('game_id', gameIds)
      .order('half', { ascending: true })
      .order('minute', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    adminClient
      .from('game_players')
      .select(
        'game_id, player_id, availability_status, availability_note, responded_at, selection_status, lineup_line, participated, minutes_played, goals, assists, yellow_cards, red_cards, coach_note',
      )
      .in('game_id', gameIds)
      .eq('selection_status', 'started')
      .not('lineup_line', 'is', null),
    adminClient.from('players').select('id, full_name'),
  ])

  if (eventsResult.error)
    handleApiError(eventsResult.error, 'Unable to load match events.', 400)
  if (startersResult.error)
    handleApiError(startersResult.error, 'Unable to load starting lineups.', 400)
  if (playersResult.error)
    handleApiError(playersResult.error, 'Unable to load players.', 400)

  const playerMap = new Map(
    (playersResult.data ?? []).map((player) => [player.id, player]),
  )

  const eventsByGame = new Map<string, GameEvent[]>()
  for (const row of eventsResult.data ?? []) {
    const list = eventsByGame.get(row.game_id) ?? []
    list.push({
      id: row.id,
      game_id: row.game_id,
      half: (row.half === 2 ? 2 : 1) as 1 | 2,
      minute: row.minute,
      event_type: row.event_type as GameEventType,
      is_our_team: row.is_our_team,
      player_id: row.player_id,
      player_name_override: row.player_name_override,
      assist_player_id: row.assist_player_id,
      event_note: row.event_note,
      home_score_after: row.home_score_after,
      away_score_after: row.away_score_after,
      sort_order: row.sort_order,
      player: row.player_id ? (playerMap.get(row.player_id) ?? null) : null,
      assist_player: row.assist_player_id
        ? (playerMap.get(row.assist_player_id) ?? null)
        : null,
    })
    eventsByGame.set(row.game_id, list)
  }

  const playersByGame = new Map<string, GamePlayer[]>()
  for (const record of startersResult.data ?? []) {
    const player = playerMap.get(record.player_id)
    if (!player) continue
    const list = playersByGame.get(record.game_id) ?? []
    list.push({
      ...record,
      availability_status:
        record.availability_status as GamePlayer['availability_status'],
      selection_status:
        record.selection_status as GamePlayer['selection_status'],
      lineup_line: (record.lineup_line as GamePlayer['lineup_line']) ?? null,
      player,
    })
    playersByGame.set(record.game_id, list)
  }

  const reports: Array<{
    game: AdminGame
    players: GamePlayer[]
    events: GameEvent[]
  }> = []
  const teamsMap = new Map<string, { id: string; name: string }>()

  for (const game of games) {
    const gameEvents = eventsByGame.get(game.id) ?? []
    const gamePlayers = playersByGame.get(game.id) ?? []
    const hasPossession =
      game.home_possession !== null &&
      game.home_possession !== undefined &&
      game.away_possession !== null &&
      game.away_possession !== undefined
    const hasReport =
      gameEvents.length > 0 ||
      gamePlayers.length > 0 ||
      hasPossession ||
      Boolean(game.summary?.trim()) ||
      Boolean(game.report_pdf_url?.trim())

    if (!hasReport) continue

    reports.push({
      game,
      players: gamePlayers,
      events: gameEvents,
    })
    teamsMap.set(game.team.id, game.team)
  }

  const teams = [...teamsMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'pl'),
  )

  return { reports, teams }
})
