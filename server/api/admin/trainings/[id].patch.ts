import { z } from 'zod'
import { requireAdminAccess } from '@@/server/utils/admin-users'
import { trainingDateToIso } from '@@/shared/utils/training-time'

const updateSchema = z.object({
  status: z.enum(['scheduled', 'moved', 'cancelled']),
  scheduled_at: z.string().optional(),
}).strict()

export default defineEventHandler(async (event) => {
  const { adminClient } = await requireAdminAccess(event)
  const id = z.uuid().parse(event.context.params?.id)
  const parsed = updateSchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Wybierz prawidłowy status treningu.' })
  const { data: current, error: loadError } = await adminClient.from('training_sessions').select('scheduled_at, original_scheduled_at, updated_at').eq('id', id).maybeSingle()
  if (loadError) throw createError({ statusCode: 500, statusMessage: 'Nie udało się wczytać treningu.' })
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono treningu.' })
  const { status } = parsed.data
  let scheduledAt = current.scheduled_at
  let originalScheduledAt = current.original_scheduled_at
  if (status === 'moved') {
    const date = trainingDateToIso(parsed.data.scheduled_at ?? '')
    originalScheduledAt ??= current.scheduled_at
    if (!date || Date.parse(date) === Date.parse(originalScheduledAt)) throw createError({ statusCode: 400, statusMessage: 'Podaj nowy termin, inny niż pierwotny (czas polski).' })
    scheduledAt = date
  } else if (status === 'scheduled') {
    scheduledAt = originalScheduledAt ?? current.scheduled_at
    originalScheduledAt = null
  }
  const { data, error } = await adminClient.from('training_sessions').update({ status, scheduled_at: scheduledAt, original_scheduled_at: originalScheduledAt }).eq('id', id).eq('updated_at', current.updated_at).select('id').maybeSingle()
  if (error) throw createError({ statusCode: error.code === '23505' ? 409 : 500, statusMessage: error.code === '23505' ? 'W tym terminie istnieje już trening z tego cyklu.' : 'Nie udało się zapisać treningu.' })
  if (!data) throw createError({ statusCode: 409, statusMessage: 'Trening został zmieniony. Odśwież stronę i spróbuj ponownie.' })
  return { success: true }
})
