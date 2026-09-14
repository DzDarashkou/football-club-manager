import { createError, readBody, type H3Event } from 'h3'
import { z } from 'zod'

export const standingsQuerySchema = z.object({
  group_id: z.uuid(),
  snapshot_id: z.uuid().optional(),
  page: z.coerce.number().int().min(0).max(10000).default(0),
})

export function validateStandingsInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw createError({ statusCode: 400, statusMessage: 'Invalid standings data.', data: { message: `Sprawdź dane (${issue?.path.join('.')}): ${issue?.message}` } })
  }
  return result.data
}

export async function readStandingsBody(event: H3Event): Promise<unknown> {
  const body: unknown = await readBody(event)
  if (JSON.stringify(body ?? null).length > 500000) {
    throw createError({ statusCode: 413, statusMessage: 'Standings data is too large.' })
  }
  return body
}
