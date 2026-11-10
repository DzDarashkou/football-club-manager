import { chromium, type Browser } from 'playwright'
import {
  type PzpnMatch,
  parsePzpnMatchesJson,
} from '@@/validators/pzpn-matches'
import type { StandingsTable } from '@@/types/standings'
import { standingsTableSchema } from '@@/validators/standings'

export type PzpnScrapeResult = {
  teamId: string
  teamName: string
  matches: PzpnMatch[]
  tables: StandingsTable[]
  bearerToken?: string
}

export type ScraperTeamConfig = {
  teamId: string
  teamName: string
  url: string
}

export type ScraperTableConfig = {
  label: string
  url: string
  playId: string
}

export const DEFAULT_PZPN_TABLES: ScraperTableConfig[] = [
  {
    label: 'Sporting 1 D1 (V liga okręgowa D1 Młodzik Grupa 1)',
    playId: 'a1c643cf-b745-4bbe-81e8-ea058315b548',
    url: 'https://www.laczynaspilka.pl/rozgrywki?season=3c77d143-8010-4073-9842-d6b63365ffce&leagueGroup=8dc010c0-405f-4cbc-97f7-f2ee0f2ec575&leagueId=337bb869-0b42-484f-8eca-0c8842a13ec9&subLeague=7c5a509a-2dac-46a7-9a37-54d48719758b&enumType=ZpnAndLeagueAndPlay&group=a1c643cf-b745-4bbe-81e8-ea058315b548&voivodeship=c38a66b8-8d8e-49b9-8772-948c097d885a&isAdvanceMode=false&genderType=Male',
  },
  {
    label: 'Sporting 1 D2 (III liga okręgowa D2 Młodzik)',
    playId: '6b323b16-45f4-4f75-b3dd-d9b04b5c373c',
    url: 'https://www.laczynaspilka.pl/rozgrywki?season=3c77d143-8010-4073-9842-d6b63365ffce&leagueGroup=8dc010c0-405f-4cbc-97f7-f2ee0f2ec575&leagueId=337bb869-0b42-484f-8eca-0c8842a13ec9&subLeague=9d41a9e1-aa66-4e2c-9f33-6f4b01139837&enumType=ZpnAndLeagueAndPlay&group=6b323b16-45f4-4f75-b3dd-d9b04b5c373c&voivodeship=c38a66b8-8d8e-49b9-8772-948c097d885a&isAdvanceMode=false&genderType=Male',
  },
  {
    label: 'Sporting 2 D2 (IV liga okręgowa D2 Młodzik Grupa 1)',
    playId: '59ec7c9e-52f0-43bf-af1c-3f2bf9607a6d',
    url: 'https://www.laczynaspilka.pl/rozgrywki?season=3c77d143-8010-4073-9842-d6b63365ffce&leagueGroup=8dc010c0-405f-4cbc-97f7-f2ee0f2ec575&leagueId=337bb869-0b42-484f-8eca-0c8842a13ec9&subLeague=9d41a9e1-aa66-4e2c-9f33-6f4b01139837&enumType=ZpnAndLeagueAndPlay&group=59ec7c9e-52f0-43bf-af1c-3f2bf9607a6d&voivodeship=c38a66b8-8d8e-49b9-8772-948c097d885a&isAdvanceMode=false&genderType=Male',
  },
]

export const DEFAULT_PZPN_TEAMS: ScraperTeamConfig[] = [
  {
    teamId: '13a8f1cd-7d40-43ce-be56-2c91c7b2a20e',
    teamName: 'Sporting Wrocław',
    url: 'https://www.laczynaspilka.pl/rozgrywki/druzyna/13a8f1cd-7d40-43ce-be56-2c91c7b2a20e?tab=tab-mecz',
  },
  {
    teamId: 'c1609652-b077-433b-b6db-2675b53b3a92',
    teamName: 'Sporting II Wrocław',
    url: 'https://www.laczynaspilka.pl/rozgrywki/druzyna/c1609652-b077-433b-b6db-2675b53b3a92?tab=tab-mecz',
  },
]

export async function fetchPzpnTableDirect(
  playId: string,
  bearerToken: string,
): Promise<StandingsTable | null> {
  try {
    const res = await fetch(
      `https://competition-api-pro2.laczynaspilka.pl/api/bus/competition/v1/plays/${playId}/tables`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          Accept: 'application/json',
        },
      },
    )
    if (!res.ok) {
      console.warn(
        `[PZPN Table] Fetch for play ${playId} returned status ${res.status}`,
      )
      return null
    }
    const json = await res.json()
    const parsed = standingsTableSchema.safeParse(json)
    if (parsed.success) {
      return parsed.data
    } else {
      console.warn(
        `[PZPN Table] Validation failed for play ${playId}:`,
        parsed.error.issues[0]?.message,
      )
      return null
    }
  } catch (err) {
    console.warn(
      `[PZPN Table] Error fetching play ${playId}:`,
      (err as Error).message,
    )
    return null
  }
}

export async function scrapePzpnDataForTeams(
  teams: ScraperTeamConfig[] = DEFAULT_PZPN_TEAMS,
  options: {
    headless?: boolean
    timeoutMs?: number
    tablesToFetch?: ScraperTableConfig[]
  } = {},
): Promise<{
  teamResults: PzpnScrapeResult[]
  tables: StandingsTable[]
}> {
  const timeoutMs = options.timeoutMs ?? 30000
  const tablesToFetch = options.tablesToFetch ?? DEFAULT_PZPN_TABLES
  let browser: Browser

  try {
    // Try installed Chrome first (ideal for Windows / Mac / Desktop Linux)
    browser = await chromium.launch({
      channel: 'chrome',
      headless: options.headless ?? true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  } catch {
    // Fall back to standard bundled Chromium
    browser = await chromium.launch({
      headless: options.headless ?? true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  const results: PzpnScrapeResult[] = []

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'pl-PL',
    })

    for (const team of teams) {
      const page = await context.newPage()
      const matches: PzpnMatch[] = []
      const tables: StandingsTable[] = []
      let capturedBearerToken: string | undefined

      // Intercept network requests to capture Bearer token and JSON payloads
      page.on('request', (req) => {
        const auth = req.headers()['authorization']
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
          capturedBearerToken = auth.slice(7).trim()
        }
      })

      page.on('response', async (res) => {
        const url = res.url()
        if (
          !url.includes('competition-api-pro2.laczynaspilka.pl') &&
          !url.includes('laczynaspilka.pl/api')
        ) {
          return
        }

        try {
          if (res.status() === 200) {
            const contentType = res.headers()['content-type'] || ''
            if (contentType.includes('application/json')) {
              const body = await res.json()
              // Check if response is matches array
              if (Array.isArray(body)) {
                try {
                  const parsedMatches = parsePzpnMatchesJson(body)
                  for (const m of parsedMatches) {
                    if (
                      !matches.some(
                        (existing) => existing.matchId === m.matchId,
                      )
                    ) {
                      matches.push(m)
                    }
                  }
                } catch {
                  // Not match fixtures JSON, ignore
                }
              } else if (body && typeof body === 'object') {
                // Check if response is a standings table
                const parsedTable = standingsTableSchema.safeParse(body)
                if (parsedTable.success) {
                  tables.push(parsedTable.data)
                }
              }
            }
          }
        } catch {
          // Ignore parse errors on other responses
        }
      })

      console.log(
        `[PZPN Scraper] Navigating to: ${team.teamName} (${team.url})...`,
      )
      try {
        await page.goto(team.url, {
          waitUntil: 'domcontentloaded',
          timeout: timeoutMs,
        })

        // Dismiss cookie banner if it appears
        try {
          const cookieBtn = page
            .locator(
              '#uc-btn-accept-all, button:has-text("Zgadzam się"), button:has-text("Akceptuję")',
            )
            .first()
          if (await cookieBtn.isVisible({ timeout: 3000 })) {
            await cookieBtn.click()
          }
        } catch {
          // Ignore banner click error
        }

        // Wait a few seconds for Angular SPA to hydrate and trigger competition API requests
        await page.waitForTimeout(4000)

        // Try clicking on "Terminarz" or "Mecze" tab if not loaded yet
        try {
          const matchTab = page
            .locator(
              'button:has-text("Terminarz"), button:has-text("Mecze"), a:has-text("Terminarz"), a:has-text("Mecze")',
            )
            .first()
          if (await matchTab.isVisible({ timeout: 2000 })) {
            await matchTab.click()
            await page.waitForTimeout(3000)
          }
        } catch {
          // Ignore tab switch error
        }

        // If we captured a bearer token, we can also query the API directly for remaining endpoints
        if (capturedBearerToken && team.teamId) {
          console.log(
            `[PZPN Scraper] Captured Bearer token for ${team.teamName}. Checking direct endpoints...`,
          )
          // In case table or played-matches wasn't requested by page yet, we can fetch
        }
      } catch (navError) {
        console.warn(
          `[PZPN Scraper] Warning during navigation to ${team.teamName}:`,
          (navError as Error).message,
        )
      } finally {
        await page.close()
      }

      console.log(
        `[PZPN Scraper] Captured ${matches.length} matches and ${tables.length} tables for ${team.teamName}.`,
      )
      results.push({
        teamId: team.teamId,
        teamName: team.teamName,
        matches,
        tables,
        bearerToken: capturedBearerToken,
      })
    }

    await context.close()

    // 2. Fetch standings tables directly using any captured bearer token
    const allTables: StandingsTable[] = []
    const availableToken = results.find((r) => r.bearerToken)?.bearerToken

    if (availableToken) {
      console.log(
        `\n[PZPN Scraper] Fetching standings tables for ${tablesToFetch.length} groups via direct API...`,
      )
      for (const tConfig of tablesToFetch) {
        console.log(
          `[PZPN Scraper] Loading table: ${tConfig.label} (${tConfig.playId})...`,
        )
        const table = await fetchPzpnTableDirect(tConfig.playId, availableToken)
        if (table) {
          allTables.push(table)
          console.log(
            `[PZPN Scraper] ✅ Captured table with ${table.rows.length} rows for play ${tConfig.playId}`,
          )
        }
      }

      // 3. Fetch league group fixtures directly to capture all matches across all groups
      console.log(
        `\n[PZPN Scraper] Fetching league matches for ${tablesToFetch.length} groups via direct API...`,
      )
      for (const tConfig of tablesToFetch) {
        try {
          const res = await fetch(
            `https://competition-api-pro2.laczynaspilka.pl/api/bus/competition/v1/plays/${tConfig.playId}/matches`,
            {
              headers: {
                Authorization: `Bearer ${availableToken}`,
                Accept: 'application/json',
              },
            },
          )
          if (res.ok) {
            const body = await res.json()
            if (Array.isArray(body)) {
              const parsed = parsePzpnMatchesJson(body)
              // Filter to matches where Sporting is host or guest
              const sportingMatches = parsed.filter(
                (m) =>
                  m.host.name.toLowerCase().includes('sporting') ||
                  m.guest.name.toLowerCase().includes('sporting'),
              )
              console.log(
                `[PZPN Scraper] Found ${sportingMatches.length} Sporting matches in play ${tConfig.playId} (${tConfig.label})`,
              )

              for (const m of sportingMatches) {
                // Determine whether it belongs to Sporting I or Sporting II
                const isSporting2 =
                  m.host.name.toLowerCase().includes('sporting ii') ||
                  m.host.name.toLowerCase().includes('sporting 2') ||
                  m.guest.name.toLowerCase().includes('sporting ii') ||
                  m.guest.name.toLowerCase().includes('sporting 2')

                const targetResult = results.find((r) =>
                  isSporting2
                    ? r.teamName.includes('II') || r.teamName.includes('2')
                    : !r.teamName.includes('II') && !r.teamName.includes('2'),
                )

                if (targetResult) {
                  if (
                    !targetResult.matches.some(
                      (existing) => existing.matchId === m.matchId,
                    )
                  ) {
                    targetResult.matches.push(m)
                  }
                }
              }
            }
          }
        } catch (mErr) {
          console.warn(
            `[PZPN Scraper] Error fetching matches for play ${tConfig.playId}:`,
            (mErr as Error).message,
          )
        }
      }
    } else {
      console.warn(
        `[PZPN Scraper] No Bearer token captured during navigation. Unable to query table endpoints directly.`,
      )
    }

    return {
      teamResults: results,
      tables: allTables,
    }
  } finally {
    await browser.close()
  }
}
