import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import {
  computeRunningScores,
  summarizePlayerEventStats,
} from '@@/lib/game-report'
import { handleApiError } from '@@/server/utils/admin-users'
import type {
  GameEvent,
  GameEventType,
  GameLocationType,
  LineupLine,
} from '@@/types/admin-club'
import type { Database } from '@@/types/database'

type AdminClient = ReturnType<typeof serverSupabaseServiceRole<Database>>

const uuid = z.uuid('A valid id is required.')
const nullableUuid = z.union([uuid, z.null()]).optional().default(null)
const nullableSmallint = z.coerce
  .number()
  .int()
  .min(0)
  .max(99)
  .nullable()
  .optional()
  .default(null)

const starterSchema = z.object({
  player_id: uuid,
  lineup_line: z.enum(['goalkeeper', 'defense', 'midfield', 'offense']),
})

const eventSchema = z.object({
  half: z.union([z.literal(1), z.literal(2)]),
  minute: z.coerce.number().int().min(1).max(150),
  event_type: z.enum([
    'goal',
    'own_goal',
    'penalty_goal',
    'yellow_card',
    'red_card',
  ]),
  is_our_team: z.boolean().default(true),
  player_id: nullableUuid,
  player_name_override: z
    .string()
    .trim()
    .max(120)
    .nullable()
    .optional()
    .default(null),
  assist_player_id: nullableUuid,
  event_note: z.string().trim().max(240).nullable().optional().default(null),
  sort_order: z.coerce.number().int().min(0).max(500).optional(),
})

export const gameReportSchema = z
  .object({
    home_possession: z.coerce
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional()
      .default(null),
    away_possession: z.coerce
      .number()
      .int()
      .min(0)
      .max(100)
      .nullable()
      .optional()
      .default(null),
    halftime_home_score: nullableSmallint,
    halftime_away_score: nullableSmallint,
    summary: z.string().trim().max(2000).nullable().optional().default(null),
    report_source: z
      .string()
      .trim()
      .max(200)
      .nullable()
      .optional()
      .default(null),
    starters: z.array(starterSchema).max(30).optional().default([]),
    events: z.array(eventSchema).max(100).optional().default([]),
    sync_player_stats: z.boolean().optional().default(true),
    sync_game_score: z.boolean().optional().default(false),
  })
  .superRefine((value, context) => {
    const hasHome = value.home_possession !== null
    const hasAway = value.away_possession !== null
    if (hasHome !== hasAway) {
      context.addIssue({
        code: 'custom',
        path: ['home_possession'],
        message: 'Podaj posiadanie piłki dla obu drużyn.',
      })
      return
    }
    if (
      hasHome &&
      hasAway &&
      (value.home_possession ?? 0) + (value.away_possession ?? 0) !== 100
    ) {
      context.addIssue({
        code: 'custom',
        path: ['home_possession'],
        message: 'Suma posiadania piłki musi wynosić 100%.',
      })
    }
  })

export type GameReportInput = z.infer<typeof gameReportSchema>

function fail(error: unknown, message: string): never {
  handleApiError(error, message, 400)
}

export async function getGameEvents(
  adminClient: AdminClient,
  gameId: string,
): Promise<GameEvent[]> {
  const { data: rows, error } = await adminClient
    .from('game_events')
    .select(
      'id, game_id, half, minute, event_type, is_our_team, player_id, player_name_override, assist_player_id, event_note, home_score_after, away_score_after, sort_order',
    )
    .eq('game_id', gameId)
    .order('half', { ascending: true })
    .order('minute', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) fail(error, 'Unable to load game events.')
  if (!rows?.length) return []

  const playerIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.player_id, row.assist_player_id])
        .filter((id): id is string => Boolean(id)),
    ),
  )

  const playerMap = new Map<string, { id: string; full_name: string }>()
  if (playerIds.length) {
    const { data: players, error: playersError } = await adminClient
      .from('players')
      .select('id, full_name')
      .in('id', playerIds)
    if (playersError) fail(playersError, 'Unable to load event players.')
    for (const player of players ?? []) playerMap.set(player.id, player)
  }

  return rows.map((row) => ({
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
  }))
}

export async function saveGameReport(
  adminClient: AdminClient,
  gameId: string,
  locationType: GameLocationType,
  payload: GameReportInput,
) {
  const scored = computeRunningScores(payload.events, locationType)

  const halftimeHome =
    payload.halftime_home_score ??
    (payload.events.length ? scored.halftimeHomeScore : null)
  const halftimeAway =
    payload.halftime_away_score ??
    (payload.events.length ? scored.halftimeAwayScore : null)

  const gameUpdate: Database['public']['Tables']['games']['Update'] = {
    home_possession: payload.home_possession,
    away_possession: payload.away_possession,
    halftime_home_score: halftimeHome,
    halftime_away_score: halftimeAway,
    summary: payload.summary,
    report_source: payload.report_source,
  }
  if (payload.sync_game_score) {
    gameUpdate.home_score = scored.homeScore
    gameUpdate.away_score = scored.awayScore
    gameUpdate.status = 'completed'
  }

  const { error: gameError } = await adminClient
    .from('games')
    .update(gameUpdate)
    .eq('id', gameId)

  if (gameError) fail(gameError, 'Unable to save match report details.')

  if (payload.starters.length || payload.sync_player_stats) {
    const starterMap = new Map<string, LineupLine>(
      payload.starters.map((item) => [item.player_id, item.lineup_line]),
    )
    const statMap = payload.sync_player_stats
      ? summarizePlayerEventStats(payload.events)
      : null

    const { data: existingPlayers, error: existingError } = await adminClient
      .from('game_players')
      .select('player_id, selection_status')
      .eq('game_id', gameId)

    if (existingError) fail(existingError, 'Unable to load game squad.')

    const updates = (existingPlayers ?? []).map((record) => {
      const update: Database['public']['Tables']['game_players']['Update'] = {}

      if (payload.starters.length) {
        const line = starterMap.get(record.player_id) ?? null
        update.selection_status = line
          ? 'started'
          : record.selection_status === 'started'
            ? 'substitute'
            : record.selection_status
        update.lineup_line = line
      }

      if (statMap) {
        const stats = statMap.get(record.player_id) ?? {
          goals: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
        }
        update.goals = stats.goals
        update.assists = stats.assists
        update.yellow_cards = stats.yellow_cards
        update.red_cards = stats.red_cards
        if (stats.goals > 0 || stats.assists > 0) {
          update.participated = true
        }
      }

      return adminClient
        .from('game_players')
        .update(update)
        .eq('game_id', gameId)
        .eq('player_id', record.player_id)
    })

    const results = await Promise.all(updates)
    const failed = results.find((result) => result.error)
    if (failed?.error) fail(failed.error, 'Unable to update starting lineup.')
  }

  const { error: deleteError } = await adminClient
    .from('game_events')
    .delete()
    .eq('game_id', gameId)

  if (deleteError) fail(deleteError, 'Unable to replace game events.')

  if (scored.events.length) {
    const { error: insertError } = await adminClient
      .from('game_events')
      .insert(
        scored.events.map((event) => ({
          game_id: gameId,
          half: event.half,
          minute: event.minute,
          event_type: event.event_type,
          is_our_team: event.is_our_team,
          player_id: event.player_id,
          player_name_override: event.player_name_override,
          assist_player_id: event.assist_player_id,
          event_note: event.event_note,
          home_score_after: event.home_score_after,
          away_score_after: event.away_score_after,
          sort_order: event.sort_order,
        })),
      )

    if (insertError) fail(insertError, 'Unable to save game events.')
  }

  return { events: await getGameEvents(adminClient, gameId) }
}
