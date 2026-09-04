import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { extractUserId } from '@@/lib/auth'
import type { Database } from '@@/types/database'
import { getMatchWeather } from '@@/server/utils/match-weather'
import { openMeteoAttribution } from '@@/types/weather'

export default defineEventHandler(async (event) => {
  const parentId = extractUserId(await serverSupabaseUser(event))
  if (!parentId) throw createError({ statusCode: 401, statusMessage: 'You must be signed in.' })
  const adminClient = serverSupabaseServiceRole<Database>(event)
  const { data: profile } = await adminClient.from('profiles').select('id').eq('id', parentId).eq('role', 'parent').eq('status', 'active').maybeSingle()
  if (!profile) throw createError({ statusCode: 403, statusMessage: 'Parent access is required.' })
  const { data: links } = await adminClient.from('player_parents').select('player_id').eq('parent_id', parentId)
  const playerIds = (links ?? []).map((item) => item.player_id)
  if (!playerIds.length) return { games: [], weatherAttribution: openMeteoAttribution }
  const [{ data: records, error: recordsError }, { data: players }, { data: games }] = await Promise.all([
    adminClient.from('game_players').select('game_id, player_id, availability_status, availability_note').in('player_id', playerIds),
    adminClient.from('players').select('id, full_name').in('id', playerIds),
    adminClient.from('games').select('id, venue_id, opponent_name, scheduled_at, location_type, status').in('status', ['scheduled', 'postponed']).order('scheduled_at'),
  ])
  if (recordsError) throw createError({ statusCode: 500, statusMessage: 'Unable to load attendance.' })
  const venueIds = [...new Set((games ?? []).flatMap((game) => game.venue_id ? [game.venue_id] : []))]
  const { data: venues } = venueIds.length ? await adminClient.from('venues').select('id, city, latitude, longitude').in('id', venueIds) : { data: [] }
  const venueMap = new Map((venues ?? []).map((venue) => [venue.id, venue]))
  const weatherByGame = new Map(await Promise.all((games ?? []).map(async (game) => [game.id, await getMatchWeather(adminClient, { gameId: game.id, kickoff: game.scheduled_at, status: game.status, city: game.venue_id ? venueMap.get(game.venue_id)?.city ?? null : null, latitude: game.venue_id ? venueMap.get(game.venue_id)?.latitude ?? null : null, longitude: game.venue_id ? venueMap.get(game.venue_id)?.longitude ?? null : null })] as const)))
  const playerMap = new Map((players ?? []).map((item) => [item.id, item]))
  const gameMap = new Map((games ?? []).map((item) => [item.id, item]))
  return { games: (records ?? []).flatMap((record) => { const player = playerMap.get(record.player_id); const game = gameMap.get(record.game_id); return player && game ? [{ ...record, player, game: { ...game, weather: weatherByGame.get(game.id) } }] : [] }), weatherAttribution: openMeteoAttribution }
})
