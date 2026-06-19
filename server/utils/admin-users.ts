import { createError, getRequestURL } from 'h3'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { z } from 'zod'
import { extractUserId, isAppRole, isAppUserStatus } from '@@/lib/auth'
import type { AdminManagedUser, ManagedAppRole } from '@@/types/admin-users'
import type { AppUserStatus } from '@@/types/auth'
import type { Database } from '@@/types/database'

const MANAGED_ROLES = ['coach', 'parent'] as const satisfies readonly ManagedAppRole[]
const USER_STATUSES = ['active', 'inactive'] as const satisfies readonly AppUserStatus[]

const managedRoleSchema = z.enum(MANAGED_ROLES)
const userStatusSchema = z.enum(USER_STATUSES)

export const adminUserCreateSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  full_name: z.string().trim().min(1, 'Full name is required.').max(120, 'Full name is too long.'),
  role: managedRoleSchema,
  status: userStatusSchema.default('active'),
})

export const adminUserUpdateSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()).optional(),
  full_name: z.string().trim().min(1, 'Full name is required.').max(120, 'Full name is too long.').optional(),
  role: managedRoleSchema.optional(),
  status: userStatusSchema.optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'At least one field must be updated.',
})

export const adminUserListQuerySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  role: z.union([managedRoleSchema, z.literal('all')]).optional().default('all'),
  status: z.union([userStatusSchema, z.literal('all')]).optional().default('all'),
})

export const adminUserIdSchema = z.uuid('User id must be a valid UUID.')

type ProfileRow = Database['public']['Tables']['profiles']['Row']

function mapProfileRow(row: ProfileRow): AdminManagedUser {
  if (!isAppRole(row.role) || row.role === 'admin' || !isAppUserStatus(row.status)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unexpected user record shape.',
    })
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    full_name: row.full_name,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function toApiError(error: unknown, fallbackMessage: string, fallbackStatusCode = 500): never {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    throw error
  }

  const details = error as { code?: string, message?: string } | null
  const message = details?.message || fallbackMessage
  const duplicateErrorCodes = new Set(['23505', 'email_exists'])
  const statusCode = details?.code && duplicateErrorCodes.has(details.code)
    ? 409
    : fallbackStatusCode

  throw createError({
    statusCode,
    statusMessage: message,
  })
}

export async function requireAdminAccess(event: Parameters<typeof serverSupabaseUser>[0]) {
  const authUser = await serverSupabaseUser(event)
  const authUserId = extractUserId(authUser)

  if (!authUserId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'You must be signed in to manage users.',
    })
  }

  const adminClient = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await adminClient
    .from('profiles')
    .select('id, email, role, status, full_name, created_at, updated_at')
    .eq('id', authUserId)
    .maybeSingle()

  if (error) {
    toApiError(error, 'Unable to verify your administrator account.')
  }

  if (!data || data.role !== 'admin' || data.status !== 'active') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only active administrators can manage users.',
    })
  }

  return {
    actorId: authUserId,
    adminClient,
  }
}

export async function getManagedUserById(
  adminClient: ReturnType<typeof serverSupabaseServiceRole<Database>>,
  userId: string,
) {
  const { data, error } = await adminClient
    .from('profiles')
    .select('id, email, role, status, full_name, created_at, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    toApiError(error, 'Unable to load the requested user.')
  }

  if (!data || data.role === 'admin') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Managed user not found.',
    })
  }

  return mapProfileRow(data)
}

export async function sendSetupEmail(
  event: Parameters<typeof serverSupabaseUser>[0],
  adminClient: ReturnType<typeof serverSupabaseServiceRole<Database>>,
  email: string,
) {
  const redirectTo = new URL('/update-password', getRequestURL(event).origin).toString()
  const { error } = await adminClient.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    return {
      setupEmailSent: false,
      setupEmailError: error.message,
    }
  }

  return {
    setupEmailSent: true,
    setupEmailError: null,
  }
}

export function handleApiError(error: unknown, fallbackMessage: string, fallbackStatusCode = 500): never {
  throw toApiError(error, fallbackMessage, fallbackStatusCode)
}

export { mapProfileRow }
