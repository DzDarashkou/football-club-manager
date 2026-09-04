export type AdminAgeGroup = {
  id: string
  name: string
  birth_year_from: number
  birth_year_to: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AdminTeam = {
  id: string
  name: string
  age_group_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  age_group: Pick<AdminAgeGroup, 'id' | 'name' | 'birth_year_from' | 'birth_year_to'>
  player_count: number
}

export type AdminPlayer = {
  id: string
  full_name: string
  shirt_number: number | null
  date_of_birth: string
  team_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  team: Pick<AdminTeam, 'id' | 'name'> & {
    age_group: AdminTeam['age_group']
  }
}

export type AdminAgeGroupsResponse = { ageGroups: AdminAgeGroup[] }
export type AdminTeamsResponse = { teams: AdminTeam[] }
export type AdminPlayersResponse = { players: AdminPlayer[] }

export type AdminAgeGroupInput = Pick<AdminAgeGroup, 'name' | 'birth_year_from' | 'birth_year_to'>
export type AdminTeamInput = Pick<AdminTeam, 'name' | 'age_group_id'> & { is_active?: boolean }
export type AdminPlayerInput = Pick<AdminPlayer, 'full_name' | 'date_of_birth' | 'team_id' | 'shirt_number'> & { is_active?: boolean }

export type GameStatus = 'scheduled' | 'completed' | 'postponed' | 'cancelled'
export type CompetitionType = 'league' | 'cup' | 'friendly' | 'tournament'
export type GameLocationType = 'home' | 'away' | 'neutral'
export type AdminSeason = { id: string, name: string, starts_on: string, ends_on: string, is_active: boolean }
export type AdminCompetition = { id: string, season_id: string, name: string, type: CompetitionType, is_active: boolean, season: Pick<AdminSeason, 'id' | 'name'> }
export type AdminVenue = { id: string, name: string, address: string | null, city: string | null, latitude: number | null, longitude: number | null, is_active: boolean }
export type AdminGame = {
  id: string
  team_id: string
  season_id: string
  competition_id: string | null
  venue_id: string | null
  opponent_name: string
  location_type: GameLocationType
  scheduled_at: string
  matchday: number | null
  round_label: string | null
  status: GameStatus
  home_score: number
  away_score: number
  notes: string | null
  team: Pick<AdminTeam, 'id' | 'name'>
  season: Pick<AdminSeason, 'id' | 'name'>
  competition: Pick<AdminCompetition, 'id' | 'name' | 'type'> | null
  venue: Pick<AdminVenue, 'id' | 'name' | 'address' | 'city' | 'latitude' | 'longitude'> | null
}
export type AdminSeasonInput = Pick<AdminSeason, 'name' | 'starts_on' | 'ends_on'>
export type AdminCompetitionInput = Pick<AdminCompetition, 'season_id' | 'name' | 'type'>
export type AdminVenueInput = Pick<AdminVenue, 'name' | 'address' | 'city' | 'latitude' | 'longitude'>
export type AdminGameInput = Omit<AdminGame, 'id' | 'team' | 'season' | 'competition' | 'venue'>
export type AdminGameSetupResponse = { seasons: AdminSeason[], competitions: AdminCompetition[], venues: AdminVenue[], teams: AdminTeam[] }
export type AdminGamesResponse = { games: AdminGame[] }
export type TrainingStatus = 'scheduled' | 'cancelled'
export type TrainingCreateInput = { team_id: string, venue_id: string | null, weekday: number, starts_on: string, ends_on: string, starts_at: string, duration_minutes: number, notes: string | null }
export type AdminTrainingSession = {
  id: string
  series_id: string
  team_id: string
  venue_id: string | null
  scheduled_at: string
  duration_minutes: number
  status: TrainingStatus
  notes: string | null
  team: Pick<AdminTeam, 'id' | 'name'>
  venue: Pick<AdminVenue, 'id' | 'name' | 'address' | 'city' | 'latitude' | 'longitude'> | null
}
export type AdminTrainingsResponse = { trainings: AdminTrainingSession[] }
export type CoachTeamAssignment = { coach_id: string, team_id: string }
export type PlayerParentAssignment = { player_id: string, parent_id: string, relationship_label: string | null }
export type AvailabilityStatus = 'pending' | 'available' | 'unavailable'
export type SelectionStatus = 'selected' | 'started' | 'substitute' | 'not_selected'
export type GamePlayer = {
  game_id: string
  player_id: string
  availability_status: AvailabilityStatus
  availability_note: string | null
  responded_at: string | null
  selection_status: SelectionStatus
  participated: boolean
  minutes_played: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  coach_note: string | null
  player: Pick<AdminPlayer, 'id' | 'full_name'>
}
