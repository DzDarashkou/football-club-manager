export type MatchWeatherCondition = 'dry' | 'possible-rain' | 'rain-likely'

export type MatchWeather = {
  status: 'available'
  temperatureMin: number
  temperatureMax: number
  precipitationProbability: number
  precipitationMm: number
  maxRainMm: number
  snowfallMm: number
  windSpeedKmh: number
  maxWindGustKmh: number
  windDirectionDegrees: number
  cloudCoverPercentage: number
  condition: MatchWeatherCondition
  fetchedAt: string
}

export type MatchWeatherUnavailable = {
  status: 'unavailable' | 'forecast-not-available-yet'
}

export type MatchWeatherResult = MatchWeather | MatchWeatherUnavailable

export const openMeteoAttribution = {
  label: 'Weather data by Open-Meteo',
  url: 'https://open-meteo.com/',
} as const
