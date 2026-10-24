import { z } from 'zod'
import type { GameLocationType, GameStatus } from '@@/types/admin-club'

export const pzpnTeamSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  logo: z.string().nullable().optional(),
  abbreviation: z.string().nullable().optional(),
})

export const pzpnMatchSchema = z.object({
  matchId: z.string().trim().min(1),
  state: z.string().trim().optional().default('Nierozegrany'),
  dateTime: z.string().trim().min(1),
  canDateTimeChange: z.boolean().optional().default(true),
  scores: z.record(z.string(), z.unknown()).optional().default({}),
  host: pzpnTeamSchema,
  guest: pzpnTeamSchema,
  league: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  play: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  stadium: z.string().trim().nullable().optional(),
  queue: z.number().int().positive().nullable().optional(),
  round: z.string().trim().nullable().optional(),
  transmissions: z.array(z.unknown()).optional().default([]),
})

export const pzpnMatchesArraySchema = z.array(pzpnMatchSchema)

export type PzpnMatch = z.infer<typeof pzpnMatchSchema>

export function parsePzpnMatchesJson(raw: unknown): PzpnMatch[] {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw
  return pzpnMatchesArraySchema.parse(data)
}

/**
 * Parses stadium string from PZPN (e.g. "Sporting Arena (Wrocław, Sukielicka 13)" or "Sukielicka 13 , 54-311 Wrocław")
 * into a name, address, and city.
 */
export function parseStadiumInfo(stadiumText: string | null | undefined): {
  name: string
  address: string | null
  city: string | null
} | null {
  if (!stadiumText || !stadiumText.trim()) return null
  const trimmed = stadiumText.trim()

  // Match pattern: "Name (Address)" or "Name (City, Address)"
  const parenMatch = trimmed.match(/^([^(]+?)\s*\(([^)]+)\)$/)
  if (parenMatch && parenMatch[1] && parenMatch[2]) {
    const rawName = parenMatch[1].trim()
    const rawAddress = parenMatch[2].trim()
    const addressParts = rawAddress.split(',').map((s) => s.trim())
    const city =
      addressParts.length > 1
        ? addressParts[0]
        : rawAddress.includes('Wrocław')
          ? 'Wrocław'
          : null
    return {
      name: rawName || rawAddress,
      address: rawAddress,
      city: city || 'Wrocław',
    }
  }

  // Fallback for simple address like "Sukielicka 13 , 54-311 Wrocław"
  const hasWroclaw = trimmed.toLowerCase().includes('wrocław')
  return {
    name: trimmed,
    address: trimmed,
    city: hasWroclaw ? 'Wrocław' : null,
  }
}

/**
 * Maps Polish local datetime string from PZPN (e.g. "2026-10-26T17:00:00")
 * to ISO 8601 string in Europe/Warsaw timezone.
 */
export function parsePzpnDateTimeToUtcIso(dateTimeStr: string): string {
  // If string already has a timezone indicator (Z or +HH:mm), parse directly
  if (/[Z+-]\d{2}(:\d{2})?$/.test(dateTimeStr)) {
    return new Date(dateTimeStr).toISOString()
  }

  // Treat as Europe/Warsaw local time:
  // We can construct a Date in the Europe/Warsaw timezone using Intl or string parsing
  const cleanIso = dateTimeStr.replace(' ', 'T')
  // Estimate Warsaw offset (+01:00 winter, +02:00 summer DST)
  const probeDate = new Date(`${cleanIso}Z`)
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Warsaw',
    timeZoneName: 'shortOffset',
  })
  const parts = formatter.formatToParts(probeDate)
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value // e.g. "GMT+2" or "GMT+1"
  const offsetHours = offsetPart?.includes('+2') ? '+02:00' : '+01:00'

  return new Date(`${cleanIso}${offsetHours}`).toISOString()
}

/**
 * Maps PZPN state to GameStatus
 */
export function mapPzpnStateToGameStatus(state: string | null | undefined): GameStatus {
  if (!state) return 'scheduled'
  const lower = state.toLowerCase().trim()
  if (lower.includes('odwołany') || lower.includes('anulowany') || lower.includes('cancelled')) {
    return 'cancelled'
  }
  if (lower.includes('przełożony') || lower.includes('postponed')) {
    return 'postponed'
  }
  if (lower.includes('nierozegrany') || lower.includes('zaplanowany') || lower.includes('scheduled')) {
    return 'scheduled'
  }
  if (lower.includes('zakończony') || lower.includes('rozegrany') || lower.includes('finished')) {
    return 'completed'
  }
  return 'scheduled'
}

/**
 * Extracts scores from the PZPN scores object
 */
export function extractScores(scores: Record<string, unknown>): {
  homeScore: number
  awayScore: number
} {
  // Common PZPN shapes:
  // { host: 3, guest: 1 }
  // { main: { host: 3, guest: 1 } }
  // { hostScore: 3, guestScore: 1 }
  const main = (scores.main as Record<string, unknown>) ?? scores
  const hostVal = main.host ?? main.hostScore ?? scores.host
  const guestVal = main.guest ?? main.guestScore ?? scores.guest

  const homeScore = typeof hostVal === 'number' ? hostVal : Number(hostVal) || 0
  const awayScore = typeof guestVal === 'number' ? guestVal : Number(guestVal) || 0

  return { homeScore, awayScore }
}
