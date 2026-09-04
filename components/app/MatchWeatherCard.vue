<script setup lang="ts">
import { Cloud, CloudRain, CloudSun, Snowflake, Sun, Thermometer, Wind } from 'lucide-vue-next'
import type { MatchWeather } from '@@/types/weather'

const props = defineProps<{ weather: MatchWeather, attribution: { label: string, url: string } }>()

const presentation = computed(() => {
  if (props.weather.snowfallMm > 0) return { icon: Snowflake, title: 'Możliwy śnieg', class: 'border-sky-200 bg-gradient-to-br from-sky-50 via-blue-50 to-white text-sky-950', iconClass: 'bg-white/80 text-sky-700' }
  if (props.weather.maxRainMm > 0 || props.weather.condition === 'rain-likely') return { icon: CloudRain, title: 'Możliwy deszcz', class: 'border-blue-200 bg-gradient-to-br from-blue-100 via-sky-50 to-white text-blue-950', iconClass: 'bg-white/75 text-blue-700' }
  if (props.weather.condition === 'possible-rain') return { icon: CloudSun, title: 'Możliwe opady', class: 'border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-white text-amber-950', iconClass: 'bg-white/80 text-amber-700' }
  if (props.weather.maxWindGustKmh >= 35) return { icon: Wind, title: 'Wietrznie', class: 'border-cyan-200 bg-gradient-to-br from-cyan-100 via-sky-50 to-white text-cyan-950', iconClass: 'bg-white/80 text-cyan-700' }
  if (props.weather.cloudCoverPercentage >= 60) return { icon: Cloud, title: 'Pochmurno', class: 'border-slate-200 bg-gradient-to-br from-slate-200 via-slate-50 to-white text-slate-950', iconClass: 'bg-white/80 text-slate-600' }
  return { icon: Sun, title: 'Sucho', class: 'border-yellow-200 bg-gradient-to-br from-yellow-100 via-amber-50 to-white text-amber-950', iconClass: 'bg-white/80 text-amber-600' }
})

const windDirection = computed(() => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(props.weather.windDirectionDegrees / 45) % 8])
</script>

<template>
  <Card :class="`overflow-hidden border ${presentation.class}`">
    <div class="flex items-start gap-3">
      <div :class="['grid h-11 w-11 shrink-0 place-items-center rounded-full shadow-sm', presentation.iconClass]">
        <component :is="presentation.icon" class="h-5 w-5" aria-hidden="true" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-label opacity-70">Prognoza pogody</p>
        <p class="mt-0.5 font-medium">{{ presentation.title }}</p>
      </div>
    </div>
    <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
      <div class="rounded-lg bg-white/60 p-3"><span class="flex items-center gap-1.5 opacity-70"><Thermometer class="h-4 w-4" aria-hidden="true" />Temperatura</span><p class="mt-1 text-base font-medium">{{ weather.temperatureMin }}–{{ weather.temperatureMax }}°C</p></div>
      <div class="rounded-lg bg-white/60 p-3"><span class="flex items-center gap-1.5 opacity-70"><CloudRain class="h-4 w-4" aria-hidden="true" />Opady</span><p class="mt-1 text-base font-medium">{{ weather.precipitationProbability }}%</p></div>
      <div class="rounded-lg bg-white/60 p-3"><span class="flex items-center gap-1.5 opacity-70"><Wind class="h-4 w-4" aria-hidden="true" />Wiatr</span><p class="mt-1 text-base font-medium">{{ Math.round(weather.windSpeedKmh) }} km/h</p></div>
      <div class="rounded-lg bg-white/60 p-3"><span class="flex items-center gap-1.5 opacity-70"><Cloud class="h-4 w-4" aria-hidden="true" />Zachmurzenie</span><p class="mt-1 text-base font-medium">{{ weather.cloudCoverPercentage }}%</p></div>
    </div>
    <p class="mt-3 text-sm opacity-75">Przewidywane opady: {{ weather.precipitationMm }} mm<span v-if="weather.snowfallMm > 0"> · śnieg: {{ weather.snowfallMm }} cm</span> · porywy: do {{ Math.round(weather.maxWindGustKmh) }} km/h z {{ windDirection }}</p>
    <a :href="attribution.url" target="_blank" rel="noopener noreferrer" class="mt-3 inline-block text-xs underline-offset-2 hover:underline">{{ attribution.label }}</a>
  </Card>
</template>
