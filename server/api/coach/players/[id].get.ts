import { z } from 'zod'
import { getPlayerById } from '@@/server/utils/admin-club'
import { getGameSetup } from '@@/server/utils/admin-games'
import { requireCoachPlayer } from '@@/server/utils/game-attendance'
import type { AdminGame, GamePlayer } from '@@/types/admin-club'

export default defineEventHandler(async (event) => {
  const playerId = z.uuid().parse(event.context.params?.id)
  const { adminClient, allowedTeamIds } = await requireCoachPlayer(event, playerId)
  const fullPlayer = await getPlayerById(adminClient, playerId)
  const player = fullPlayer && allowedTeamIds ? { ...fullPlayer, teams: fullPlayer.teams.filter((team) => allowedTeamIds.has(team.id)) } : fullPlayer
  if (!player) throw createError({ statusCode: 404, statusMessage: 'Player not found.' })

  const { data: records, error: recordsError } = await adminClient
    .from('game_players')
    .select('game_id, player_id, availability_status, availability_note, responded_at, selection_status, participated, minutes_played, goals, assists, yellow_cards, red_cards, coach_note')
    .eq('player_id', playerId)

  if (recordsError) throw createError({ statusCode: 500, statusMessage: 'Unable to load player game records.' })
  if (!records?.length) return { player, games: [] }

  const gameIds = records.map((record) => record.game_id)
  let gamesRequest = adminClient.from('games').select('id, team_id, season_id, competition_id, venue_id, opponent_name, location_type, scheduled_at, matchday, round_label, status, home_score, away_score, notes').in('id', gameIds).order('scheduled_at', { ascending: false })
  if (allowedTeamIds) gamesRequest = gamesRequest.in('team_id', [...allowedTeamIds])
  const [{ data: gameRows, error: gamesError }, setup] = await Promise.all([gamesRequest, getGameSetup(adminClient)])

  if (gamesError) throw createError({ statusCode: 500, statusMessage: 'Unable to load player games.' })

  const teams = new Map(setup.teams.map((team) => [team.id, team]))
  const seasons = new Map(setup.seasons.map((season) => [season.id, season]))
  const competitions = new Map(setup.competitions.map((competition) => [competition.id, competition]))
  const venues = new Map(setup.venues.map((venue) => [venue.id, venue]))
  const recordsByGameId = new Map(records.map((record) => [record.game_id, record]))

  const games = (gameRows ?? []).flatMap((game) => {
    const team = teams.get(game.team_id)
    const season = seasons.get(game.season_id)
    const record = recordsByGameId.get(game.id)
    if (!team || !season || !record) return []

    const competition = game.competition_id ? competitions.get(game.competition_id) ?? null : null
    const venue = game.venue_id ? venues.get(game.venue_id) ?? null : null
    const gameDetail: AdminGame = {
      ...game,
      location_type: game.location_type as AdminGame['location_type'],
      status: game.status as AdminGame['status'],
      team: { id: team.id, name: team.name },
      season: { id: season.id, name: season.name },
      competition: competition ? { id: competition.id, name: competition.name, type: competition.type } : null,
      venue: venue ? { id: venue.id, name: venue.name, address: venue.address, city: venue.city, latitude: venue.latitude, longitude: venue.longitude } : null,
    }
    const gamePlayer: GamePlayer = {
      ...record,
      availability_status: record.availability_status as GamePlayer['availability_status'],
      selection_status: record.selection_status as GamePlayer['selection_status'],
      player: { id: player.id, full_name: player.full_name },
    }

    return [{ game: gameDetail, record: gamePlayer }]
  })

  return { player, games }
})
