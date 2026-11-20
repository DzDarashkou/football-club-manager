import { createError, readMultipartFormData } from 'h3'
import { z } from 'zod'
import { parseMatchReportText } from '@@/lib/game-report-parser'
import {
  getActiveTeamPlayers,
  requireCoachGame,
} from '@@/server/utils/game-attendance'
import { extractTextFromPdfBuffer } from '@@/server/utils/pdf-text'
import type { GameLocationType } from '@@/types/admin-club'

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024
const jsonBodySchema = z.object({
  text: z.string().trim().min(10, 'Wklej treść raportu (min. 10 znaków).').max(50_000),
})

export default defineEventHandler(async (event) => {
  const gameId = z.uuid().parse(event.context.params?.id)
  const { adminClient } = await requireCoachGame(event, gameId)

  const { data: game, error: gameError } = await adminClient
    .from('games')
    .select('team_id, location_type')
    .eq('id', gameId)
    .maybeSingle()

  if (gameError || !game) {
    throw createError({ statusCode: 404, statusMessage: 'Game not found.' })
  }

  let rawText = ''
  let defaultSource = 'Import z tekstu'

  const contentType = getHeader(event, 'content-type') ?? ''
  if (contentType.includes('multipart/form-data')) {
    const parts = await readMultipartFormData(event)
    const filePart = parts?.find((part) => part.name === 'file' && part.data?.length)
    const textPart = parts?.find((part) => part.name === 'text')

    if (filePart) {
      if (filePart.data.length > MAX_UPLOAD_BYTES) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Plik jest za duży (maks. 2 MB).',
        })
      }
      const filename = (filePart.filename ?? '').toLowerCase()
      if (filename.endsWith('.pdf') || filePart.type === 'application/pdf') {
        rawText = extractTextFromPdfBuffer(filePart.data)
        defaultSource = 'szczegółowy przebieg przekazany w PDF'
        if (!rawText) {
          throw createError({
            statusCode: 400,
            statusMessage:
              'Nie udało się odczytać tekstu z tego pliku PDF (np. skan lub niestandardowe kodowanie). Wklej treść raportu ręcznie.',
          })
        }
      } else {
        rawText = filePart.data.toString('utf8').trim()
        defaultSource = filename ? `Import z pliku (${filePart.filename})` : 'Import z pliku'
      }
    } else if (textPart?.data?.length) {
      rawText = textPart.data.toString('utf8').trim()
    }
  } else {
    const body = jsonBodySchema.parse(await readBody(event))
    rawText = body.text
  }

  if (rawText.length < 10) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Brak treści raportu do przetworzenia.',
    })
  }

  const teamPlayers = await getActiveTeamPlayers(adminClient, game.team_id)
  return parseMatchReportText(rawText, teamPlayers, {
    locationType: game.location_type as GameLocationType,
    defaultSource,
  })
})
