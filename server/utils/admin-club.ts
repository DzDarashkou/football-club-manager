import { createError } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { z } from 'zod'
import { handleApiError, requireAdminAccess } from '@@/server/utils/admin-users'
import type { AdminAgeGroup, AdminPlayer, AdminTeam } from '@@/types/admin-club'
import type { Database } from '@@/types/database'

const nameSchema = z.string().trim().min(2, 'Name must contain at least 2 characters.').max(120, 'Name is too long.')
const uuidSchema = z.uuid('A valid record id is required.')

const ageGroupFields = z.object({
  name: nameSchema,
  birth_year_from: z.coerce.number().int().min(1900).max(2100),
  birth_year_to: z.coerce.number().int().min(1900).max(2100),
})

export const ageGroupCreateSchema = ageGroupFields.refine(({ birth_year_from, birth_year_to }) => birth_year_to >= birth_year_from, {
  message: 'The final birth year must not be earlier than the first birth year.',
  path: ['birth_year_to'],
})

export const ageGroupUpdateSchema = ageGroupFields.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be updated.',
}).refine((value) => value.birth_year_from === undefined || value.birth_year_to === undefined || value.birth_year_to >= value.birth_year_from, {
  message: 'The final birth year must not be earlier than the first birth year.',
  path: ['birth_year_to'],
})

export const teamCreateSchema = z.object({
  name: nameSchema,
  age_group_id: uuidSchema,
  is_active: z.boolean().optional().default(true),
})

export const teamUpdateSchema = teamCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be updated.',
})

export const playerCreateSchema = z.object({
  full_name: nameSchema,
  shirt_number: z.coerce.number().int().min(1).max(99).nullable().optional().default(null),
  date_of_birth: z.iso.date().refine((value) => value <= new Date().toISOString().slice(0, 10), {
    message: 'Date of birth cannot be in the future.',
  }),
  team_ids: z.array(uuidSchema).min(1, 'Assign the player to at least one team.').max(30).transform((ids) => [...new Set(ids)]),
  is_active: z.boolean().optional().default(true),
})

export const playerUpdateSchema = playerCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be updated.',
})

export const recordIdSchema = uuidSchema
export const playerListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  team_id: z.union([uuidSchema, z.literal('all')]).optional().default('all'),
})

type AdminClient = ReturnType<typeof serverSupabaseServiceRole<Database>>

function asError(error: unknown, fallback: string): never {
  handleApiError(error, fallback, 400)
}

export async function requireActiveAgeGroup(adminClient: AdminClient, ageGroupId: string) {
  const { data, error } = await adminClient
    .from('age_groups')
    .select('id')
    .eq('id', ageGroupId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) asError(error, 'Unable to validate the age group.')
  if (!data) {
    throw createError({ statusCode: 400, statusMessage: 'Select an active age group.' })
  }
}

export async function requireActiveTeam(adminClient: AdminClient, teamId: string) {
  const { data, error } = await adminClient
    .from('teams')
    .select('id')
    .eq('id', teamId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) asError(error, 'Unable to validate the team.')
  if (!data) {
    throw createError({ statusCode: 400, statusMessage: 'Select an active team.' })
  }
}

export async function getAgeGroups(adminClient: AdminClient): Promise<AdminAgeGroup[]> {
  const { data, error } = await adminClient
    .from('age_groups')
    .select('id, name, birth_year_from, birth_year_to, is_active, created_at, updated_at')
    .order('birth_year_from', { ascending: false })
    .order('name')

  if (error) asError(error, 'Unable to load age groups.')
  return data ?? []
}

export async function getTeams(adminClient: AdminClient): Promise<AdminTeam[]> {
  const [teamResult, ageGroupResult, playerResult] = await Promise.all([
    adminClient.from('teams').select('id, name, age_group_id, is_active, created_at, updated_at').order('name'),
    getAgeGroups(adminClient),
    adminClient.from('player_teams').select('team_id'),
  ])

  if (teamResult.error) asError(teamResult.error, 'Unable to load teams.')
  if (playerResult.error) asError(playerResult.error, 'Unable to load team player counts.')

  const ageGroupsById = new Map(ageGroupResult.map((ageGroup) => [ageGroup.id, ageGroup]))
  const playerCounts = new Map<string, number>()
  for (const player of playerResult.data ?? []) {
    playerCounts.set(player.team_id, (playerCounts.get(player.team_id) ?? 0) + 1)
  }

  return (teamResult.data ?? []).flatMap((team) => {
    const ageGroup = ageGroupsById.get(team.age_group_id)
    if (!ageGroup) return []
    return [{
      ...team,
      age_group: {
        id: ageGroup.id,
        name: ageGroup.name,
        birth_year_from: ageGroup.birth_year_from,
        birth_year_to: ageGroup.birth_year_to,
      },
      player_count: playerCounts.get(team.id) ?? 0,
    }]
  })
}

export async function getPlayers(adminClient: AdminClient, query: z.infer<typeof playerListQuerySchema>): Promise<AdminPlayer[]> {
  let request = adminClient.from('players').select('id, full_name, shirt_number, date_of_birth, is_active, created_at, updated_at').order('full_name').limit(100)
  if (query.q) request = request.ilike('full_name', `%${query.q.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`)

  const [playerResult, teams] = await Promise.all([request, getTeams(adminClient)])
  if (playerResult.error) asError(playerResult.error, 'Unable to load players.')
  const playerIds = (playerResult.data ?? []).map((player) => player.id)
  if (!playerIds.length) return []
  const { data: memberships, error: membershipsError } = await adminClient.from('player_teams').select('player_id, team_id').in('player_id', playerIds)
  if (membershipsError) asError(membershipsError, 'Unable to load player team assignments.')

  const teamsById = new Map(teams.map((team) => [team.id, team]))
  const teamsByPlayerId = new Map<string, AdminPlayer['teams']>()
  for (const membership of memberships ?? []) {
    const team = teamsById.get(membership.team_id)
    if (!team) continue
    teamsByPlayerId.set(membership.player_id, [...(teamsByPlayerId.get(membership.player_id) ?? []), { id: team.id, name: team.name, age_group: team.age_group }])
  }
  return (playerResult.data ?? []).flatMap((player) => {
    const playerTeams = teamsByPlayerId.get(player.id) ?? []
    return query.team_id === 'all' || playerTeams.some((team) => team.id === query.team_id) ? [{ ...player, teams: playerTeams }] : []
  })
}

export async function getPlayerById(adminClient: AdminClient, playerId: string): Promise<AdminPlayer | null> {
  const [playerResult, teams, membershipsResult] = await Promise.all([
    adminClient.from('players').select('id, full_name, shirt_number, date_of_birth, is_active, created_at, updated_at').eq('id', playerId).maybeSingle(),
    getTeams(adminClient),
    adminClient.from('player_teams').select('team_id').eq('player_id', playerId),
  ])

  if (playerResult.error) asError(playerResult.error, 'Unable to load the player.')
  if (membershipsResult.error) asError(membershipsResult.error, 'Unable to load player team assignments.')
  const player = playerResult.data
  if (!player) return null

  const teamsById = new Map(teams.map((team) => [team.id, team]))
  const playerTeams = (membershipsResult.data ?? []).flatMap(({ team_id }) => {
    const team = teamsById.get(team_id)
    return team ? [{ id: team.id, name: team.name, age_group: team.age_group }] : []
  })
  return { ...player, teams: playerTeams }
}
