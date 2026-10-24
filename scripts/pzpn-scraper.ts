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

export async function scrapePzpnDataForTeams(
  teams: ScraperTeamConfig[] = DEFAULT_PZPN_TEAMS,
  options: { headless?: boolean; timeoutMs?: number } = {},
): Promise<PzpnScrapeResult[]> {
  const timeoutMs = options.timeoutMs ?? 30000
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
                    if (!matches.some((existing) => existing.matchId === m.matchId)) {
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

      console.log(`[PZPN Scraper] Navigating to: ${team.teamName} (${team.url})...`)
      try {
        await page.goto(team.url, {
          waitUntil: 'domcontentloaded',
          timeout: timeoutMs,
        })

        // Dismiss cookie banner if it appears
        try {
          const cookieBtn = page.locator('#uc-btn-accept-all, button:has-text("Zgadzam się"), button:has-text("Akceptuję")').first()
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
          const matchTab = page.locator('button:has-text("Terminarz"), button:has-text("Mecze"), a:has-text("Terminarz"), a:has-text("Mecze")').first()
          if (await matchTab.isVisible({ timeout: 2000 })) {
            await matchTab.click()
            await page.waitForTimeout(3000)
          }
        } catch {
          // Ignore tab switch error
        }

        // If we captured a bearer token, we can also query the API directly for remaining endpoints
        if (capturedBearerToken && team.teamId) {
          console.log(`[PZPN Scraper] Captured Bearer token for ${team.teamName}. Checking direct endpoints...`)
          // In case table or played-matches wasn't requested by page yet, we can fetch
        }

      } catch (navError) {
        console.warn(`[PZPN Scraper] Warning during navigation to ${team.teamName}:`, (navError as Error).message)
      } finally {
        await page.close()
      }

      console.log(`[PZPN Scraper] Captured ${matches.length} matches and ${tables.length} tables for ${team.teamName}.`)
      results.push({
        teamId: team.teamId,
        teamName: team.teamName,
        matches,
        tables,
        bearerToken: capturedBearerToken,
      })
    }

    await context.close()
  } finally {
    await browser.close()
  }

  return results
}
