import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/database'
import type { MatchWeather, MatchWeatherCondition, MatchWeatherResult } from '@@/types/weather'

type WeatherClient = ReturnType<typeof serverSupabaseServiceRole<Database>>
type MatchLocation = {
  gameId: string
  kickoff: string
  status: string
  city: string | null
  latitude: number | null
  longitude: number | null
  expectedDurationMinutes?: number
  cacheKind?: 'game' | 'training'
}
type Coordinates = { latitude: number, longitude: number }
type OpenMeteoForecast = {
  timezone?: string
  hourly?: {
    time?: unknown
    temperature_2m?: unknown[]
    precipitation_probability?: unknown[]
    precipitation?: unknown[]
    rain?: unknown[]
    snowfall?: unknown[]
  }
}
type OpenMeteoGeocoding = { results?: Array<{ latitude?: unknown, longitude?: unknown }> }

const FORECAST_LIMIT_MS = 16 * 24 * 60 * 60 * 1000
const DEFAULT_MATCH_DURATION_MINUTES = 90
const HTTP_TIMEOUT_MS = 5_000
const pendingWeatherRequests = new Map<string, Promise<MatchWeatherResult>>()

function weatherWarning(message: string, error?: unknown) {
  // Weather is intentionally non-critical; do not expose provider failures to match users.
  console.warn(`[weather] ${message}`, error instanceof Error ? error.message : '')
}

function normaliseCity(city: string) {
  return city.trim().toLocaleLowerCase('pl-PL').replace(/\s+/g, ' ')
}

function formatLocal(date: Date, timeZone: string) {
  const values = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', minute: '2-digit',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => values.find((value) => value.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}

function dateAround(value: Date, days: number) {
  const result = new Date(value)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

function cacheTtlMs(kickoff: Date, now: Date) {
  const hoursUntilKickoff = (kickoff.getTime() - now.getTime()) / 3_600_000
  if (hoursUntilKickoff < 48) return 60 * 60 * 1000
  if (hoursUntilKickoff < 7 * 24) return 3 * 60 * 60 * 1000
  return 6 * 60 * 60 * 1000
}

function conditionFor(probability: number): MatchWeatherCondition {
  if (probability >= 60) return 'rain-likely'
  if (probability >= 30) return 'possible-rain'
  return 'dry'
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

type WeatherCache = Database['public']['Tables']['match_weather_cache']['Row'] | Database['public']['Tables']['training_weather_cache']['Row']
function mapCachedWeather(cache: WeatherCache): MatchWeather {
  return {
    status: 'available', temperatureMin: cache.temperature_min, temperatureMax: cache.temperature_max,
    precipitationProbability: cache.precipitation_probability, precipitationMm: cache.precipitation_mm,
    maxRainMm: cache.max_rain_mm, snowfallMm: cache.snowfall_mm, condition: cache.condition as MatchWeatherCondition, fetchedAt: cache.fetched_at,
  }
}

function calculateWeather(forecast: OpenMeteoForecast, kickoff: Date, durationMinutes: number): Omit<MatchWeather, 'status' | 'fetchedAt'> | null {
  if (!forecast.timezone || !forecast.hourly || !Array.isArray(forecast.hourly.time)) return null
  const start = formatLocal(kickoff, forecast.timezone).slice(0, 14) + '00'
  const end = formatLocal(new Date(kickoff.getTime() + durationMinutes * 60_000), forecast.timezone).slice(0, 14) + '00'
  const temperature: number[] = []; const probability: number[] = []; const precipitation: number[] = []; const rain: number[] = []; const snowfall: number[] = []
  for (let index = 0; index < forecast.hourly.time.length; index += 1) {
    const time = forecast.hourly.time[index]
    if (typeof time !== 'string' || time < start || time > end) continue
    const temp = finiteNumber(forecast.hourly.temperature_2m?.[index])
    const chance = finiteNumber(forecast.hourly.precipitation_probability?.[index])
    const precipitationValue = finiteNumber(forecast.hourly.precipitation?.[index])
    const rainValue = finiteNumber(forecast.hourly.rain?.[index])
    const snowfallValue = finiteNumber(forecast.hourly.snowfall?.[index])
    if (temp !== null) temperature.push(temp)
    if (chance !== null) probability.push(chance)
    if (precipitationValue !== null) precipitation.push(precipitationValue)
    if (rainValue !== null) rain.push(rainValue)
    if (snowfallValue !== null) snowfall.push(snowfallValue)
  }
  if (!temperature.length || !probability.length || !precipitation.length || !rain.length) return null
  const precipitationProbability = Math.max(...probability)
  return {
    temperatureMin: Math.min(...temperature), temperatureMax: Math.max(...temperature), precipitationProbability,
    precipitationMm: precipitation.reduce((sum, value) => sum + value, 0), maxRainMm: Math.max(...rain), snowfallMm: snowfall.reduce((sum, value) => sum + value, 0), condition: conditionFor(precipitationProbability),
  }
}

async function fetchJson<T>(url: URL): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HTTP_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } })
    if (!response.ok) throw new Error(`Open-Meteo responded with ${response.status}`)
    return await response.json() as T
  }
  finally { clearTimeout(timer) }
}

async function resolveCoordinates(client: WeatherClient, city: string): Promise<Coordinates | null> {
  const cityKey = normaliseCity(city)
  const { data: cached, error: cacheError } = await client.from('weather_location_cache').select('latitude, longitude').eq('city_key', cityKey).maybeSingle()
  if (cacheError) weatherWarning('Unable to read the location cache.', cacheError)
  if (cached) return cached
  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
    url.search = new URLSearchParams({ name: city, count: '1', language: 'pl', format: 'json' }).toString()
    const response = await fetchJson<OpenMeteoGeocoding>(url)
    const match = response.results?.[0]
    const latitude = finiteNumber(match?.latitude); const longitude = finiteNumber(match?.longitude)
    if (latitude === null || longitude === null) return null
    const coordinates = { latitude, longitude }
    const { error } = await client.from('weather_location_cache').upsert({ city_key: cityKey, city, ...coordinates, updated_at: new Date().toISOString() })
    if (error) weatherWarning('Unable to write the location cache.', error)
    return coordinates
  }
  catch (error) { weatherWarning('Unable to geocode the match city.', error); return null }
}

async function loadMatchWeather(client: WeatherClient, match: MatchLocation): Promise<MatchWeatherResult> {
  const kickoff = new Date(match.kickoff)
  const now = new Date()
  if (match.status !== 'scheduled' || Number.isNaN(kickoff.getTime())) return { status: 'unavailable' }
  if (kickoff.getTime() - now.getTime() > FORECAST_LIMIT_MS) return { status: 'forecast-not-available-yet' }

  const cacheQuery = match.cacheKind === 'training'
    ? client.from('training_weather_cache').select('*').eq('training_session_id', match.gameId).maybeSingle()
    : client.from('match_weather_cache').select('*').eq('game_id', match.gameId).maybeSingle()
  const { data: cached, error: cacheError } = await cacheQuery
  if (cacheError) weatherWarning('Unable to read the match weather cache.', cacheError)
  const cachedMatchesKickoff = cached && new Date(cached.kickoff_at).getTime() === kickoff.getTime()
  if (cachedMatchesKickoff && new Date(cached.expires_at) > now) return mapCachedWeather(cached)

  const coordinates = match.latitude !== null && match.longitude !== null
    ? { latitude: match.latitude, longitude: match.longitude }
    : match.city ? await resolveCoordinates(client, match.city) : null
  if (!coordinates) return cachedMatchesKickoff ? mapCachedWeather(cached) : { status: 'unavailable' }

  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    // The date range is padded by one UTC day because Open-Meteo returns local timestamps.
    // This safely covers all IANA offsets and DST while retaining a tiny, match-specific response.
    url.search = new URLSearchParams({
      latitude: String(coordinates.latitude), longitude: String(coordinates.longitude),
      hourly: 'temperature_2m,precipitation_probability,precipitation,rain,snowfall', timezone: 'auto',
      start_date: dateAround(kickoff, -1), end_date: dateAround(new Date(kickoff.getTime() + (match.expectedDurationMinutes ?? DEFAULT_MATCH_DURATION_MINUTES) * 60_000), 1),
    }).toString()
    const forecast = await fetchJson<OpenMeteoForecast>(url)
    const calculated = calculateWeather(forecast, kickoff, match.expectedDurationMinutes ?? DEFAULT_MATCH_DURATION_MINUTES)
    if (!calculated) throw new Error('Open-Meteo response did not contain complete match-hour data.')
    const fetchedAt = now.toISOString()
    const weather: MatchWeather = { status: 'available', ...calculated, fetchedAt }
    const cacheRecord = {
      kickoff_at: kickoff.toISOString(), ...coordinates,
      temperature_min: weather.temperatureMin, temperature_max: weather.temperatureMax,
      precipitation_probability: weather.precipitationProbability, precipitation_mm: weather.precipitationMm,
      max_rain_mm: weather.maxRainMm, snowfall_mm: weather.snowfallMm, condition: weather.condition, fetched_at: fetchedAt,
      expires_at: new Date(now.getTime() + cacheTtlMs(kickoff, now)).toISOString(),
    }
    const { error } = match.cacheKind === 'training'
      ? await client.from('training_weather_cache').upsert({ training_session_id: match.gameId, ...cacheRecord })
      : await client.from('match_weather_cache').upsert({ game_id: match.gameId, ...cacheRecord })
    if (error) weatherWarning('Unable to write the match weather cache.', error)
    return weather
  }
  catch (error) { weatherWarning('Unable to load the Open-Meteo forecast.', error); return cachedMatchesKickoff ? mapCachedWeather(cached) : { status: 'unavailable' } }
}

/** Coalesces concurrent requests for one match within a server instance. */
export function getMatchWeather(client: WeatherClient, match: MatchLocation): Promise<MatchWeatherResult> {
  const pending = pendingWeatherRequests.get(match.gameId)
  if (pending) return pending
  const request = loadMatchWeather(client, match).finally(() => pendingWeatherRequests.delete(match.gameId))
  pendingWeatherRequests.set(match.gameId, request)
  return request
}
