import { z } from 'zod'

const name = z.string().trim().min(1).max(250)
const count = z.number().int().min(0).max(100000)
const entity = z.object({ id: z.uuid(), name })

export const standingsTableSchema = z.object({
  league: entity,
  play: entity.extend({ zpn: entity }),
  rows: z.array(z.object({
    index: z.number().int().min(1).max(200),
    positionStatus: z.string().max(40),
    promotionStatus: z.string().max(40),
    stats: z.object({
      points: z.number().int().min(-100000).max(100000),
      matchesCount: count,
      winsCount: count,
      drawsCount: count,
      losesCount: count,
      goalsCount: count,
      lostGoalsCount: count,
      balanceGoalsCount: z.number().int().min(-100000).max(100000),
    }),
    team: entity.extend({
      logo: z.string().max(2000).nullable().optional(),
      abbreviation: z.string().max(40),
    }),
    isCancelled: z.boolean(),
  })).max(200),
}).superRefine((table, context) => {
  if (new Set(table.rows.map(row => row.team.id)).size !== table.rows.length) {
    context.addIssue({ code: 'custom', path: ['rows'], message: 'Tabela zawiera powtórzone drużyny.' })
  }
  if (new Set(table.rows.map(row => row.index)).size !== table.rows.length) {
    context.addIssue({ code: 'custom', path: ['rows'], message: 'Tabela zawiera powtórzone pozycje.' })
  }
})

export const standingsGroupSchema = z.object({ team_id: z.uuid(), season_id: z.uuid(), name })
export const standingsImportSchema = z.object({
  group_id: z.uuid(),
  external_team_id: z.uuid(),
  table: standingsTableSchema,
}).superRefine((input, context) => {
  if (!input.table.rows.some(row => row.team.id === input.external_team_id)) {
    context.addIssue({ code: 'custom', path: ['external_team_id'], message: 'Wybierz drużynę klubu z importowanej tabeli.' })
  }
})

export function parseStandingsJson(text: string): z.infer<typeof standingsTableSchema> {
  if (text.length > 500000) throw new Error('Dane JSON są zbyt duże (maksymalnie 500 KB).')
  let value: unknown
  try { value = JSON.parse(text) }
  catch { throw new Error('Niepoprawny JSON. Wklej pełną odpowiedź z tabelą.') }
  const result = standingsTableSchema.safeParse(value)
  if (!result.success) {
    const issue = result.error.issues[0]
    throw new Error(`Niepoprawne dane tabeli (${issue?.path.join('.') || 'JSON'}): ${issue?.message}`)
  }
  return result.data
}
